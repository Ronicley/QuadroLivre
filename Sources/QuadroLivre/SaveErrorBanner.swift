import SwiftUI

/// Sheet-local feedback avoids trying to present an alert behind an active sheet.
struct SaveErrorBanner: View {
    @ObservedObject var model: CanvasModel
    var body: some View {
        if let message = model.errorMessage {
            VStack(alignment: .leading, spacing: 12) {
                Label("Precisamos de ajuda", systemImage: "exclamationmark.triangle.fill").font(.headline)
                Text(message).font(.callout)
                HStack {
                    Button("Tentar novamente") { model.retrySave() }.buttonStyle(.bordered)
                    Button("Fechar aviso") { model.errorMessage = nil }.buttonStyle(.bordered)
                }
            }
            .padding().frame(maxWidth: .infinity, alignment: .leading)
            .background(.yellow.opacity(0.2))
            .accessibilityElement(children: .contain)
        }
    }
}
