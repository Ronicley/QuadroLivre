import Foundation

struct TemplatePlacement: Codable, Equatable, Sendable {
    let id: String
    let assetVersion: Int
    let rect: CGRect

    func validateShape() throws {
        guard !id.isEmpty, assetVersion > 0,
              rect.origin.x.isFinite, rect.origin.y.isFinite,
              rect.width.isFinite, rect.height.isFinite,
              rect.width > 0, rect.height > 0,
              rect.minX >= 0, rect.minY >= 0,
              rect.maxX <= 16_384, rect.maxY <= 16_384 else {
            throw BoardDocumentError.invalidMetadata
        }
    }
}

struct BoardMetadata: Codable, Equatable, Sendable {
    let version: Int
    let kind: String
    let template: TemplatePlacement?
    var guideOpacity: Double? = nil
    var viewport: BoardViewport? = nil
    var contoursAboveInk: Bool { kind == "coloring" }
    var templateOpacity: Double { kind == "trace" ? (guideOpacity ?? 0.4) : 1 }
    static let free = BoardMetadata(version: 1, kind: "free", template: nil)

    func validateShape() throws {
        let legacy = version == 1 && ((kind == "free" && template == nil) || (kind == "template" && template != nil)) && guideOpacity == nil
        let modern = version == 2 && ((kind == "free" && template == nil && guideOpacity == nil) ||
            (kind == "trace" && template != nil && guideOpacity.map { $0.isFinite && (0.35...0.45).contains($0) } == true) ||
            (kind == "coloring" && template != nil && guideOpacity == nil))
        guard legacy || modern else { throw BoardDocumentError.invalidMetadata }
        try template?.validateShape()
        if let viewport { try viewport.validate() }
    }
}

struct BoardViewport: Codable, Equatable, Sendable {
    let scale: Double
    let x: Double
    let y: Double
    func validate() throws {
        guard scale.isFinite, scale > 0, scale <= 3, x.isFinite, y.isFinite,
              abs(x) <= 100_000, abs(y) <= 100_000 else { throw BoardDocumentError.invalidMetadata }
    }
}

/// A single atomic file commits both the drawing and its template link.
struct BoardSnapshot: Codable {
    let formatVersion: Int
    let metadata: BoardMetadata
    let drawing: Data
}

enum BoardDocumentError: LocalizedError {
    case invalidMetadata
    case missingTemplate(String, Int)
    var errorDescription: String? {
        switch self {
        case .invalidMetadata: return "Os metadados deste quadro estão ilegíveis ou são de uma versão não suportada. O arquivo foi preservado."
        case let .missingTemplate(id, version):
            return "O esboço \(id) (versão \(version)) não está disponível. O quadro foi preservado; restaure o modelo antes de abrir ou exportar."
        }
    }
}
