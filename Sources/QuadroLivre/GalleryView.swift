import SwiftUI

struct GalleryView: View {
    @ObservedObject var model: CanvasModel
    @Environment(\.dismiss) private var dismiss
    @State private var creating = false

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 180), spacing: 20)], spacing: 20) {
                    Button {
                        creating = true
                    } label: {
                        VStack(spacing: 12) {
                            Image(systemName: "plus.circle.fill").font(.system(size: 64))
                            Text("Novo quadro").font(.headline)
                        }.frame(maxWidth: .infinity).frame(height: 170)
                            .background(.indigo.opacity(0.08), in: RoundedRectangle(cornerRadius: 24))
                    }.buttonStyle(.plain).foregroundStyle(.indigo)
                    ForEach(model.boards) { board in
                        Button {
                            model.open(board.id)
                            if model.currentID == board.id { dismiss() }
                        } label: {
                            BoardPreview(board: board)
                                .frame(height: 170)
                                .overlay(alignment: .bottomTrailing) {
                                    if board.id == model.currentID {
                                        Image(systemName: "checkmark.circle.fill").font(.title)
                                            .foregroundStyle(.indigo).padding(10)
                                    }
                                }
                        }.buttonStyle(.plain)
                        .accessibilityLabel("Desenho de \(board.modified.formatted(date: .abbreviated, time: .shortened))")
                    }
                }.padding(24)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .safeAreaInset(edge: .top) { SaveErrorBanner(model: model) }
            .sheet(isPresented: $creating) {
                NewBoardView(model: model) { creating = false; dismiss() }
            }
            .navigationTitle("Meus desenhos")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Voltar", systemImage: "xmark") { dismiss() }.frame(minHeight: 60) } }
        }
    }
}

struct BoardPreview: View {
    let board: Board
    var body: some View {
        Group {
            if let image = UIImage(contentsOfFile: board.thumbnail.path) {
                Image(uiImage: image).resizable().scaledToFit().padding(12)
            } else { Image(systemName: "scribble.variable").font(.system(size: 56)).foregroundStyle(.indigo) }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.white, in: RoundedRectangle(cornerRadius: 24))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(.gray.opacity(0.2)))
        .id("\(board.id)-\(board.modified.timeIntervalSince1970)")
    }
}
