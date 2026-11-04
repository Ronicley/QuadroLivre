import Foundation

struct ActivityCatalog: Decodable {
    struct Category: Decodable, Identifiable {
        let id: String
        let title: String
        let symbol: String
    }
    struct Variant: Decodable {
        let asset: String
        let thumbnail: String
    }
    struct Item: Decodable, Identifiable {
        let id: String
        let title: String
        let category: String
        let complexity: String
        let assetVersion: Int
        let aspectRatio: Double
        let author: String
        let license: String
        let variants: [String: Variant]
        let reviewStatus: String?
        let number: Int?

        func metadata(mode: String) -> BoardMetadata {
            BoardMetadata(version: 2, kind: mode, template: TemplatePlacement(
                id: id, assetVersion: assetVersion,
                rect: CGRect(x: 7742, y: 7742, width: 900, height: 900)),
                guideOpacity: mode == "trace" ? 0.4 : nil)
        }
    }
    let version: Int
    let stage: String
    let categories: [Category]
    let items: [Item]
    let archivedItems: [Item]?

    /// The picker uses only current items; saved boards resolve an exact version.
    var allRevisions: [Item] { items + (archivedItems ?? []) }

    func resolve(id: String, version: Int) -> Item? {
        allRevisions.first { $0.id == id && $0.assetVersion == version }
    }

    func validate(fileExists: (String) -> Bool) throws {
        guard [1, 2].contains(version), ["pilot-awaiting-approval", "catalog-awaiting-approval", "complete"].contains(stage),
              items.count == (stage == "pilot-awaiting-approval" ? 6 : 100), categories.count == 10,
              Set(categories.map(\.id)).count == categories.count,
              Set(items.map(\.id)).count == items.count,
              Set(allRevisions.map { "\($0.id):\($0.assetVersion)" }).count == allRevisions.count else { throw BoardDocumentError.invalidMetadata }
        if stage != "pilot-awaiting-approval" {
            guard Set(items.compactMap(\.number)) == Set(1...100),
                  categories.allSatisfy({ category in items.filter { $0.category == category.id }.count == 10 }),
                  items.filter({ $0.complexity == "simple" }).count == 40,
                  items.filter({ $0.complexity == "intermediate" }).count == 40,
                  items.filter({ $0.complexity == "scene" }).count == 20 else { throw BoardDocumentError.invalidMetadata }
        }
        if version == 2 {
            for item in items {
                guard ["approved-reference", "awaiting-approval", "approved"].contains(item.reviewStatus ?? ""),
                      stage != "complete" || item.reviewStatus == "approved" else { throw BoardDocumentError.invalidMetadata }
            }
        }
        for item in allRevisions {
            guard !item.id.isEmpty, item.id.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-") }),
                  categories.contains(where: { $0.id == item.category }),
                  item.assetVersion > 0, item.aspectRatio == 1,
                  ["simple", "intermediate", "scene"].contains(item.complexity),
                  !item.author.isEmpty, !item.license.isEmpty,
                  Set(item.variants.keys) == Set(["trace", "coloring"]) else { throw BoardDocumentError.invalidMetadata }
            for variant in item.variants.values {
                for file in [variant.asset, variant.thumbnail] {
                    guard !file.isEmpty, file.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-") }),
                          fileExists(file) else { throw BoardDocumentError.missingTemplate(item.id, item.assetVersion) }
                }
            }
        }
    }
}
