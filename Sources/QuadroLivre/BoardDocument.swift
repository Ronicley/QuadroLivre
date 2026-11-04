import Foundation
import UIKit
import PencilKit

extension BoardMetadata {
    func validate() throws {
        try validateShape()
        if version == 2, template != nil { _ = try IllustrationAssets.catalog.get() }
        if let template, protectedImage == nil {
            throw BoardDocumentError.missingTemplate(template.id, template.assetVersion)
        }
    }

    var protectedImage: UIImage? {
        guard let template else { return nil }
        if kind == "template" { return TemplateCatalog.image(id: template.id, version: template.assetVersion) }
        return IllustrationAssets.image(id: template.id, version: template.assetVersion, mode: kind)
    }
}

/// Bounded shared cache, also used by thumbnails. UIKit's memory warning clears it.
final class IllustrationAssets {
    static let catalog: Result<ActivityCatalog, Error> = Result {
        guard let url = Bundle.module.url(forResource: "catalog-v1", withExtension: "json") else {
            throw BoardDocumentError.invalidMetadata
        }
        let value = try JSONDecoder().decode(ActivityCatalog.self, from: Data(contentsOf: url))
        try value.validate { Bundle.module.url(forResource: $0, withExtension: "png") != nil }
        return value
    }
    private static let cache: NSCache<NSString, UIImage> = {
        let value = NSCache<NSString, UIImage>()
        value.totalCostLimit = 32 * 1024 * 1024
        value.countLimit = 24
        return value
    }()
    private static let warning = NotificationCenter.default.addObserver(
        forName: UIApplication.didReceiveMemoryWarningNotification, object: nil, queue: nil
    ) { _ in cache.removeAllObjects() }

    static func image(id: String, version: Int, mode: String, thumbnail: Bool = false) -> UIImage? {
        _ = warning
        guard let catalog = try? catalog.get(),
              let item = catalog.resolve(id: id, version: version),
              let variant = item.variants[mode] else { return nil }
        let name = thumbnail ? variant.thumbnail : variant.asset
        if let image = cache.object(forKey: name as NSString) { return image }
        guard let url = Bundle.module.url(forResource: name, withExtension: "png"),
              let image = UIImage(contentsOfFile: url.path) else { return nil }
        cache.setObject(image, forKey: name as NSString, cost: Int(image.size.width * image.size.height * 4))
        return image
    }
}

struct LoadedBoard {
    let drawing: PKDrawing
    let metadata: BoardMetadata
}

struct DrawingTemplate: Identifiable {
    let id: String
    let name: String
    var image: UIImage? { TemplateCatalog.image(id: id, version: 1) }
    var metadata: BoardMetadata {
        BoardMetadata(version: 1, kind: "template", template: TemplatePlacement(
            id: id, assetVersion: 1, rect: CGRect(x: 16_384 / 2 - 450, y: 16_384 / 2 - 450, width: 900, height: 900)))
    }
}

enum TemplateCatalog {
    static let all: [DrawingTemplate] = [
        .init(id: "cat", name: "Gato"), .init(id: "dog", name: "Cachorro"),
        .init(id: "butterfly", name: "Borboleta"), .init(id: "house", name: "Casa"),
        .init(id: "car", name: "Carro"), .init(id: "flower", name: "Flor")
    ]
    static func image(id: String, version: Int) -> UIImage? {
        // Explicit allowlist: never interpret document metadata as a filesystem path.
        guard all.contains(where: { $0.id == id }), version == 1,
              let url = Bundle.module.url(forResource: "\(id)-v\(version)", withExtension: "png") else { return nil }
        return UIImage(contentsOfFile: url.path)
    }
}
