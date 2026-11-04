import Foundation
import PencilKit
import UIKit

struct Board: Identifiable, Sendable {
    let id: UUID
    let modified: Date
    let thumbnail: URL
}

/// Editable drawings are the source of truth; previews may always be regenerated.
struct DrawingStore: Sendable {
    let directory: URL
    private var files: FileManager { .default }

    init(directory: URL? = nil) throws {
        let files = FileManager.default
        self.directory = try directory ?? files.url(
            for: .documentDirectory, in: .userDomainMask,
            appropriateFor: nil, create: true
        ).appendingPathComponent("Quadros", isDirectory: true)
        try files.createDirectory(at: self.directory, withIntermediateDirectories: true)
    }

    func drawingURL(_ id: UUID) -> URL {
        directory.appendingPathComponent(id.uuidString).appendingPathExtension("drawing")
    }

    func thumbnailURL(_ id: UUID) -> URL {
        directory.appendingPathComponent(id.uuidString).appendingPathExtension("png")
    }

    func list() throws -> [Board] {
        let contents = try files.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.contentModificationDateKey])
        let snapshots = Set(contents.filter { $0.pathExtension == "board" }.map { $0.deletingPathExtension().lastPathComponent })
        return try contents
            .filter { $0.pathExtension == "board" || ($0.pathExtension == "drawing" && !snapshots.contains($0.deletingPathExtension().lastPathComponent)) }
            .compactMap { url in
                guard let id = UUID(uuidString: url.deletingPathExtension().lastPathComponent) else { return nil }
                let date = try url.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate ?? .distantPast
                return Board(id: id, modified: date, thumbnail: thumbnailURL(id))
            }.sorted { $0.modified > $1.modified }
    }

    func snapshotURL(_ id: UUID) -> URL {
        directory.appendingPathComponent(id.uuidString).appendingPathExtension("board")
    }

    func load(_ id: UUID) throws -> LoadedBoard {
        if files.fileExists(atPath: snapshotURL(id).path) {
            let data = try Data(contentsOf: snapshotURL(id))
            let snapshot: BoardSnapshot
            do { snapshot = try PropertyListDecoder().decode(BoardSnapshot.self, from: data) }
            catch { throw BoardDocumentError.invalidMetadata }
            guard snapshot.formatVersion == 1 else { throw BoardDocumentError.invalidMetadata }
            try snapshot.metadata.validate()
            return LoadedBoard(drawing: try PKDrawing(data: snapshot.drawing), metadata: snapshot.metadata)
        }
        // Only genuinely absent V1.1 documents may fall back to the legacy drawing.
        return LoadedBoard(drawing: try PKDrawing(data: Data(contentsOf: drawingURL(id))), metadata: .free)
    }

    func save(_ drawing: PKDrawing, id: UUID, metadata: BoardMetadata) throws {
        try metadata.validate()
        let snapshot = BoardSnapshot(formatVersion: 1, metadata: metadata, drawing: drawing.dataRepresentation())
        let encoder = PropertyListEncoder()
        encoder.outputFormat = .binary
        try encoder.encode(snapshot).write(to: snapshotURL(id), options: .atomic)
        // Keep a legacy source untouched after migration; the atomic snapshot takes precedence.
    }

    func saveThumbnail(_ drawing: PKDrawing, id: UUID, metadata: BoardMetadata) {
        guard let image = try? Self.image(drawing, metadata: metadata, maxDimension: 400),
              let png = image.pngData() else { return }
        try? png.write(to: thumbnailURL(id), options: .atomic)
    }

    func delete(_ id: UUID) throws {
        // Remove the legacy backup first so a partial deletion cannot resurrect it.
        if files.fileExists(atPath: drawingURL(id).path) { try files.removeItem(at: drawingURL(id)) }
        if files.fileExists(atPath: snapshotURL(id).path) { try files.removeItem(at: snapshotURL(id)) }
        try? files.removeItem(at: thumbnailURL(id))
    }

    static func image(_ drawing: PKDrawing, metadata: BoardMetadata, maxDimension: CGFloat) throws -> UIImage {
        try metadata.validate()
        var rect = drawing.strokes.isEmpty ? CGRect.null : drawing.bounds
        if let template = metadata.template { rect = rect.union(template.rect) }
        if rect.isNull || rect.isInfinite || rect.isEmpty {
            rect = CGRect(x: 0, y: 0, width: 512, height: 512)
        } else {
            rect = rect.insetBy(dx: -32, dy: -32)
        }
        let scale = min(1, maxDimension / max(rect.width, rect.height))
        let size = BoardGeometry.exportSize(for: rect, maximum: maxDimension)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        return UIGraphicsImageRenderer(size: size, format: format).image { context in
            UIColor.white.setFill()
            context.fill(CGRect(origin: .zero, size: size))
            func drawTemplate() {
                guard let template = metadata.template, let image = metadata.protectedImage else { return }
                let target = CGRect(x: (template.rect.minX - rect.minX) * scale,
                                    y: (template.rect.minY - rect.minY) * scale,
                                    width: template.rect.width * scale, height: template.rect.height * scale)
                image.draw(in: target, blendMode: .normal, alpha: metadata.templateOpacity)
            }
            if !metadata.contoursAboveInk { drawTemplate() }
            drawing.image(from: rect, scale: scale).draw(in: CGRect(x: 0, y: 0, width: rect.width * scale, height: rect.height * scale))
            if metadata.contoursAboveInk { drawTemplate() }
        }
    }
}
