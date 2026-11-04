import SwiftUI

@main
struct QuadroLivreApp: App {
    @StateObject private var model = CanvasModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            DrawingScreen(model: model)
                .preferredColorScheme(.light)
                .onChange(of: scenePhase) { _, phase in
                    if phase != .active { model.flush() }
                }
        }
    }
}
