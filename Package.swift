// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "QuadroLivre",
    platforms: [.iOS(.v17)],
    products: [.library(name: "QuadroLivre", targets: ["QuadroLivre"])],
    targets: [.target(name: "QuadroLivre", resources: [.process("Resources")])],
    swiftLanguageModes: [.v5]
)
