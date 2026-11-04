import Foundation

var checks = 0
func check(_ condition: @autoclosure () -> Bool, _ message: String) {
    checks += 1
    guard condition() else { fatalError(message) }
}
let side: CGFloat = 16_384
for viewport in [CGSize(width: 820, height: 900), CGSize(width: 1180, height: 600), CGSize(width: 360, height: 500)] {
    let empty = BoardGeometry.fit(content: nil, viewport: viewport, side: side)
    check(empty.scale > 0 && empty.scale <= 1, "Empty board scale")
    check(empty.offset.x > 0 && empty.offset.y > 0, "Empty board centered in world")
    for rect in [CGRect(x: 0, y: 0, width: side, height: side),
                 CGRect(x: 50, y: 50, width: 100, height: 100),
                 CGRect(x: side - 100, y: side - 100, width: 100, height: 100)] {
        let fit = BoardGeometry.fit(content: rect, viewport: viewport, side: side)
        check(fit.scale >= fit.minimumScale, "Scale within minimum")
        check(rect.width * fit.scale <= viewport.width + 0.01, "Whole drawing fits horizontally")
        check(rect.height * fit.scale <= viewport.height + 0.01, "Whole drawing fits vertically")
        check(fit.offset.x >= 0 && fit.offset.y >= 0, "No negative offset")
        check(fit.offset.x <= max(0, side * fit.scale - viewport.width), "Horizontal world bounds")
        check(fit.offset.y <= max(0, side * fit.scale - viewport.height), "Vertical world bounds")
    }
}
for dimension: CGFloat in [400, 2048] {
    for rect in [CGRect(x: 0, y: 0, width: side, height: side),
                 CGRect(x: 0, y: 0, width: 10, height: side),
                 CGRect(x: 0, y: 0, width: 512, height: 512),
                 .zero] {
        let size = BoardGeometry.exportSize(for: rect, maximum: dimension)
        check(size.width >= 1 && size.height >= 1, "Export non-empty")
        check(max(size.width, size.height) <= dimension, "Export memory bound")
    }
}
// Fit against actual persistent overlay rectangles, not just the full canvas.
for viewport in [CGSize(width: 820, height: 1180), CGSize(width: 1180, height: 820), CGSize(width: 320, height: 500)] {
    let bottom: CGFloat = viewport.width < 356 ? 168 : 104
    let content = CGRect(x: side / 2 - 450, y: side / 2 - 450, width: 900, height: 900)
    let fit = BoardGeometry.fitProtected(content: content, viewport: viewport, side: side,
                                          top: 84, left: 20, bottom: bottom, right: 20)
    let screen = CGRect(x: content.minX * fit.scale - fit.offset.x,
                        y: content.minY * fit.scale - fit.offset.y,
                        width: content.width * fit.scale, height: content.height * fit.scale)
    check(screen.minX >= 19.99 && screen.maxX <= viewport.width - 19.99, "Protected horizontal margins")
    check(screen.minY >= 83.99 && screen.maxY <= viewport.height - bottom + 0.01, "Protected vertical margins")
    if viewport.width >= 356 {
        let covered: CGFloat = 2 * 60 * 60 + 332 * 76
        check(1 - covered / (viewport.width * viewport.height) >= 0.9, "Theoretical iPad area target; device measurement still required")
    }
}

for content in [CGRect(x: 0, y: 0, width: side, height: side),
                CGRect(x: 0, y: 0, width: 100, height: 100),
                CGRect(x: side - 100, y: side - 100, width: 100, height: 100)] {
    let viewport = CGSize(width: 820, height: 1180)
    let fit = BoardGeometry.fitProtected(content: content, viewport: viewport, side: side,
                                          top: 84, left: 20, bottom: 104, right: 20)
    check(content.minX * fit.scale - fit.offset.x >= 19.99, "World edge respects left controls")
    check(content.maxX * fit.scale - fit.offset.x <= viewport.width - 19.99, "World edge respects right controls")
    check(content.minY * fit.scale - fit.offset.y >= 83.99, "World edge respects top controls")
    check(content.maxY * fit.scale - fit.offset.y <= viewport.height - 103.99, "World edge respects dock")
}

var palette = PalettePreferences.empty
check(palette.valid, "Empty preferences valid")
check(PalettePreferences.curated.count == 24, "Curated visual palette")
check(PalettePreferences.curated.allSatisfy(\.valid), "Explicit color component bounds")
let pink = PalettePreferences.curated[0]
let brown = PalettePreferences.curated[23]
check(palette.choose(pink, at: 0) == 0, "First extra slot")
check(palette.choose(brown, at: 1) == 1, "Second extra slot")
check(palette.choose(pink, at: 1) == 0, "Duplicate selects existing sample")
check(palette.slots[1] == brown, "Duplicate leaves edited sample intact")
let defaultsName = "QuadroLivre.tests.\(UUID().uuidString)"
let defaults = UserDefaults(suiteName: defaultsName)!
do {
    try palette.save(to: defaults)
    let loaded = try PalettePreferences.load(from: defaults)
    check(loaded == palette, "Extras survive round trip")
} catch { fatalError("Preferences round trip: \(error)") }
defaults.set(Data("broken".utf8), forKey: PalettePreferences.key)
do {
    _ = try PalettePreferences.load(from: defaults)
    fatalError("Corrupt preferences must not be treated as absent")
} catch { check(defaults.data(forKey: PalettePreferences.key) == Data("broken".utf8), "Corrupt data preserved") }
defaults.removePersistentDomain(forName: defaultsName)

// Rainbow sampling is independent of event speed/frequency on a straight path.
var slow = RainbowSampler()
slow.begin(.zero)
var slowSegments: [RainbowSampler.Segment] = []
for x in 1...720 { slowSegments += slow.append(CGPoint(x: x, y: 0)) }
var fast = RainbowSampler()
fast.begin(.zero)
let fastSegments = fast.append(CGPoint(x: 720, y: 0))
check(slowSegments.count == fastSegments.count && fastSegments.count == 240, "Distance, not event count, advances color")
for (a, b) in zip(slowSegments, fastSegments) {
    check(a.start == b.start && a.end == b.end && a.distance == b.distance, "Stable sampling at different speeds")
}
check(RainbowSampler.color(at: 0) == RainbowSampler.color(at: 360), "Rainbow repeats")
check(RainbowSampler.color(at: 0) != RainbowSampler.color(at: 180), "Several colors in one stroke")
check(fast.append(CGPoint(x: 720, y: 0)).isEmpty, "Pausing never advances color")
check(fast.finish() == nil, "Exact boundary has no redundant segment")
var dot = RainbowSampler()
dot.begin(CGPoint(x: 10, y: 10))
check(dot.finish() != nil, "A stylus dot remains visible")
var short = RainbowSampler()
short.begin(.zero)
check(short.append(CGPoint(x: 1, y: 0)).isEmpty, "Sub-spacing preview deferred")
check(short.finish()?.end == CGPoint(x: 1, y: 0), "Short stroke keeps its endpoint")
for segment in fastSegments {
    check(hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y) <= 3.001, "Bounded color steps")
}
let templatePlacement = TemplatePlacement(id: "cat", assetVersion: 1,
    rect: CGRect(x: 7742, y: 7742, width: 900, height: 900))
let templateMetadata = BoardMetadata(version: 1, kind: "template", template: templatePlacement)
do {
    try BoardMetadata.free.validateShape()
    try templateMetadata.validateShape()
    let snapshot = BoardSnapshot(formatVersion: 1, metadata: templateMetadata, drawing: Data([1, 2, 3]))
    let data = try PropertyListEncoder().encode(snapshot)
    let loaded = try PropertyListDecoder().decode(BoardSnapshot.self, from: data)
    check(loaded.metadata == templateMetadata, "Snapshot preserves template identity/version/position")
    check(loaded.drawing == snapshot.drawing, "Snapshot commits ink in the same envelope")
} catch { fatalError("Metadata round trip: \(error)") }
for invalid in [
    BoardMetadata(version: 3, kind: "free", template: nil),
    BoardMetadata(version: 1, kind: "template", template: nil),
    BoardMetadata(version: 1, kind: "free", template: templatePlacement),
    BoardMetadata(version: 1, kind: "other", template: templatePlacement),
    BoardMetadata(version: 1, kind: "template", template: TemplatePlacement(id: "cat", assetVersion: 1, rect: .zero)),
    BoardMetadata(version: 1, kind: "template", template: TemplatePlacement(id: "cat", assetVersion: 1,
        rect: CGRect(x: -10, y: 0, width: 900, height: 900))),
    BoardMetadata(version: 1, kind: "template", template: TemplatePlacement(id: "cat", assetVersion: 1,
        rect: CGRect(x: 16_000, y: 0, width: 900, height: 900)))
] {
    do { try invalid.validateShape(); fatalError("Invalid metadata accepted") }
    catch { check(true, "Invalid metadata rejected, not treated as free") }
}
do {
    _ = try PropertyListDecoder().decode(BoardSnapshot.self, from: Data("corrupt".utf8))
    fatalError("Corrupt snapshot accepted")
} catch { check(true, "Corrupt snapshot is not legacy/free metadata") }
for kind in ["trace", "coloring"] {
    var metadata = BoardMetadata(version: 2, kind: kind, template: templatePlacement,
        guideOpacity: kind == "trace" ? 0.4 : nil)
    metadata.viewport = BoardViewport(scale: 0.65, x: 4000, y: 4100)
    do {
        try metadata.validateShape()
        let data = try PropertyListEncoder().encode(metadata)
        let loaded = try PropertyListDecoder().decode(BoardMetadata.self, from: data)
        check(loaded == metadata, "Mode, contrast and viewport round trip")
        check(metadata.contoursAboveInk == (kind == "coloring"), "Composition order is explicit")
        check(metadata.templateOpacity == (kind == "trace" ? 0.4 : 1), "Guide contrast is versioned")
    } catch { fatalError("Modern metadata: \(error)") }
}
for opacity in [Double.nan, -1, 0, 0.9] {
    let invalid = BoardMetadata(version: 2, kind: "trace", template: templatePlacement, guideOpacity: opacity)
    do { try invalid.validateShape(); fatalError("Invalid contrast accepted") }
    catch { check(true, "Invalid contrast rejected") }
}
check(templateMetadata.templateOpacity == 1 && !templateMetadata.contoursAboveInk, "V1.1 appearance unchanged")
let resourceDirectory = URL(fileURLWithPath: "Sources/QuadroLivre/Resources")
do {
    let catalog = try JSONDecoder().decode(ActivityCatalog.self, from: Data(contentsOf: resourceDirectory.appendingPathComponent("catalog-v1.json")))
    try catalog.validate { FileManager.default.fileExists(atPath: resourceDirectory.appendingPathComponent($0 + ".png").path) }
    check(catalog.items.count == 100, "Exactly 100 current themes")
    check(catalog.stage == "catalog-awaiting-approval", "Full catalog available without claiming final user approval")
    check(Set(catalog.items.compactMap(\.number)) == Set(1...100), "All 100 approved theme numbers represented")
    for category in catalog.categories {
        check(catalog.items.filter { $0.category == category.id }.count == 10, "Ten themes per category")
    }
    check(catalog.items.filter { $0.complexity == "simple" }.count == 40, "40 simple themes")
    check(catalog.items.filter { $0.complexity == "intermediate" }.count == 40, "40 intermediate themes")
    check(catalog.items.filter { $0.complexity == "scene" }.count == 20, "20 scenes")
    check(catalog.archivedItems?.count == 6, "Shipped V1 pilot revisions retained")
    check(catalog.items.allSatisfy { $0.assetVersion == 2 }, "New activities use V2 artwork")
    check(Set(catalog.items.filter { $0.reviewStatus == "approved" }.map(\.id)) == Set(["cat-seated", "child-rabbit", "dollhouse", "air-adventure", "cat-reading", "smiling-car"]), "The six pilots are approved, not the 94 new illustrations")
    check(catalog.items.filter { $0.reviewStatus == "awaiting-approval" }.count == 94, "Final user review remains explicit")
    check(catalog.resolve(id: "cat-seated", version: 99) == nil, "Unknown revision never falls back to latest")
    check(catalog.resolve(id: "missing", version: 2) == nil, "Unknown theme remains an error")
    for old in catalog.archivedItems ?? [] {
        let resolved = catalog.resolve(id: old.id, version: 1)
        check(resolved?.variants["trace"]?.asset == old.variants["trace"]?.asset, "Old trace board retains its exact source")
        check(resolved?.variants["coloring"]?.asset == old.variants["coloring"]?.asset, "Old coloring board retains its exact source")
        check(catalog.resolve(id: old.id, version: 2)?.id == old.id, "Stable theme ID across versions")
    }
    let oldManifest = try Data(contentsOf: URL(fileURLWithPath: "Support/Illustrations/catalog-v1-archive.json"))
    let legacyCatalog = try JSONDecoder().decode(ActivityCatalog.self, from: oldManifest)
    try legacyCatalog.validate { FileManager.default.fileExists(atPath: resourceDirectory.appendingPathComponent($0 + ".png").path) }
    check(legacyCatalog.version == 1 && legacyCatalog.archivedItems == nil, "Original manifest schema still decodes")
    let archivedAsset = catalog.archivedItems!.first!.variants["trace"]!.asset
    do {
        try catalog.validate { $0 != archivedAsset }
        fatalError("Missing archived source accepted")
    } catch { check(true, "Missing historical assets fail visibly") }
    let currentData = try Data(contentsOf: resourceDirectory.appendingPathComponent("catalog-v1.json"))
    func expectInvalidManifest(_ mutate: (inout [String: Any]) -> Void, _ message: String) throws {
        var json = try JSONSerialization.jsonObject(with: currentData) as! [String: Any]
        mutate(&json)
        let data = try JSONSerialization.data(withJSONObject: json)
        do {
            let modified = try JSONDecoder().decode(ActivityCatalog.self, from: data)
            try modified.validate { _ in true }
            fatalError(message)
        } catch { check(true, message) }
    }
    try expectInvalidManifest({ $0["version"] = 99 }, "Unknown catalog schema rejected")
    try expectInvalidManifest({ $0["stage"] = "complete" }, "Cannot announce the final catalog approved before review")
    try expectInvalidManifest({ json in
        var archived = json["archivedItems"] as! [[String: Any]]
        archived.append(archived[0])
        json["archivedItems"] = archived
    }, "Duplicate historical revision rejected")
    try expectInvalidManifest({ json in
        var items = json["items"] as! [[String: Any]]
        items[1]["id"] = items[0]["id"]
        json["items"] = items
    }, "Duplicate current ID rejected")
    try expectInvalidManifest({ json in
        var items = json["items"] as! [[String: Any]]
        items[0]["reviewStatus"] = "assumed-approved"
        json["items"] = items
    }, "Unsupported approval state rejected")
    try expectInvalidManifest({ json in
        let item = (json["items"] as! [[String: Any]])[1]
        json["stage"] = "complete"
        json["items"] = (1...100).map { index -> [String: Any] in
            var copy = item
            copy["id"] = "unreviewed-\(index)"
            return copy
        }
    }, "100 generated but unreviewed items cannot pass publication gate")
    try expectInvalidManifest({ json in
        var items = json["items"] as! [[String: Any]]
        items.removeLast()
        json["items"] = items
    }, "99 is not a complete selection of 100 themes")
    try expectInvalidManifest({ json in
        var items = json["items"] as! [[String: Any]]
        items[1]["number"] = 1
        json["items"] = items
    }, "Duplicate theme number rejected")
    try expectInvalidManifest({ json in
        var items = json["items"] as! [[String: Any]]
        items[1]["category"] = "B"
        json["items"] = items
    }, "Category imbalance rejected")
    try expectInvalidManifest({ json in
        var items = json["items"] as! [[String: Any]]
        items[1]["complexity"] = "simple"
        json["items"] = items
    }, "Complexity imbalance rejected")
    let pilotData = try Data(contentsOf: URL(fileURLWithPath: "Support/Illustrations/catalog-v2-pilot.json"))
    let pilot = try JSONDecoder().decode(ActivityCatalog.self, from: pilotData)
    try pilot.validate { FileManager.default.fileExists(atPath: resourceDirectory.appendingPathComponent($0 + ".png").path) }
    check(pilot.items.count == 6, "V2 pilot schema remains valid")
    for original in pilot.items {
        let resolved = catalog.resolve(id: original.id, version: original.assetVersion)
        for mode in ["trace", "coloring"] {
            check(resolved?.variants[mode]?.asset == original.variants[mode]?.asset, "All approved pilot assets remain exact")
        }
    }
    for item in catalog.items {
        for mode in ["trace", "coloring"] {
            let metadata = item.metadata(mode: mode)
            try metadata.validateShape()
            let data = try PropertyListEncoder().encode(metadata)
            let restored = try PropertyListDecoder().decode(BoardMetadata.self, from: data)
            check(restored == metadata, "Every activity preserves mode and exact illustration revision")
            check(catalog.resolve(id: restored.template!.id, version: restored.template!.assetVersion)?.variants[mode] != nil, "Each of the 200 activities resolves independently")
        }
        check(item.variants["trace"]!.asset != item.variants["coloring"]!.asset, "Distinct presentations")
    }
    do { try catalog.validate { _ in false }; fatalError("Missing assets accepted") }
    catch { check(true, "Missing assets rejected") }
} catch { fatalError("Catalog validation: \(error)") }
print("Passed \(checks) geometry, palette, catalog, metadata and rainbow sampling regression checks.")
