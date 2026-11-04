import SwiftUI

struct NewBoardView: View {
    @ObservedObject var model: CanvasModel
    let created: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var mode: String?
    @State private var category: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    if let mode {
                        catalog(mode: mode)
                    } else {
                        if model.currentID != nil {
                            Button("Continuar meu desenho", systemImage: "pencil.tip") { dismiss() }
                                .font(.title2.bold()).padding(20)
                        }
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: 24)], spacing: 24) {
                            choice("Livre", mode: "free") { create(.free) }
                            choice("Seguir contorno", mode: "trace") { self.mode = "trace" }
                            choice("Colorir", mode: "coloring") { self.mode = "coloring" }
                        }
                        .frame(maxWidth: 960)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(24)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .center)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(uiColor: .systemGroupedBackground))
            .safeAreaInset(edge: .top) { SaveErrorBanner(model: model) }
            .navigationTitle(mode == nil ? "O que vamos fazer?" : mode == "trace" ? "Seguir contorno" : "Colorir")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Voltar", systemImage: "arrow.left") {
                        if mode != nil { mode = nil; category = nil } else { dismiss() }
                    }.frame(minHeight: 60)
                }
            }
        }
    }

    @ViewBuilder private func catalog(mode: String) -> some View {
        switch IllustrationAssets.catalog {
        case .failure(let error):
            Text(error.localizedDescription).padding(24)
        case .success(let catalog):
            if catalog.stage == "catalog-awaiting-approval" {
                Text("100 temas disponíveis. A coleção nova está em revisão final com o responsável.")
                    .font(.callout).padding()
            } else if catalog.stage == "pilot-awaiting-approval" {
                Text("6 pares-piloto — referência visual aprovada.")
                    .font(.callout).padding()
            }
            ScrollView(.horizontal) {
                HStack {
                    categoryButton("Todos", symbol: "square.grid.2x2", id: nil)
                    ForEach(catalog.categories) { item in
                        categoryButton(item.title, symbol: item.symbol, id: item.id)
                    }
                }.padding(.horizontal)
            }
            let items = catalog.items.filter { category == nil || $0.category == category }
            if items.isEmpty { Text("Esta categoria estará disponível após a revisão das amostras.").padding(24) }
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 180), spacing: 16)], spacing: 16) {
                ForEach(items) { item in
                    Button { create(item.metadata(mode: mode)) } label: {
                        VStack {
                            if let image = IllustrationAssets.image(id: item.id, version: item.assetVersion, mode: mode, thumbnail: true) {
                                Image(uiImage: image).resizable().scaledToFit().frame(height: 160)
                            }
                            Text(item.title).font(.title3.bold())
                        }.padding(16).frame(maxWidth: .infinity)
                            .background(.white, in: RoundedRectangle(cornerRadius: 24))
                    }.buttonStyle(.plain)
                }
            }.padding(20)
        }
    }

    private func categoryButton(_ title: String, symbol: String, id: String?) -> some View {
        Button { category = id } label: {
            Label(title, systemImage: symbol).padding(16)
                .background(category == id ? Color.indigo.opacity(0.18) : .white, in: RoundedRectangle(cornerRadius: 18))
        }.buttonStyle(.plain)
    }

    private func create(_ metadata: BoardMetadata) {
        let previous = model.currentID
        model.newBoard(metadata: metadata)
        if model.currentID != previous { created() }
    }

    private func choice(_ name: String, mode: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16).fill(.white)
                    if mode == "free" {
                        Path { p in
                            p.move(to: CGPoint(x: 25, y: 100))
                            p.addCurve(to: CGPoint(x: 170, y: 45), control1: CGPoint(x: 140, y: 0), control2: CGPoint(x: 20, y: 150))
                        }.stroke(LinearGradient(colors: [.pink, .orange, .blue], startPoint: .leading, endPoint: .trailing), style: StrokeStyle(lineWidth: 9, lineCap: .round))
                    } else {
                        if mode == "coloring" {
                            Ellipse().fill(.orange.opacity(0.65)).frame(width: 60, height: 55).offset(y: 30)
                        }
                        if let catalog = try? IllustrationAssets.catalog.get(),
                           let item = catalog.items.first(where: { $0.id == "cat-seated" }),
                           let image = IllustrationAssets.image(id: item.id, version: item.assetVersion, mode: mode, thumbnail: true) {
                            Image(uiImage: image).resizable().scaledToFit()
                        }
                        if mode == "trace" {
                            Path { p in
                                p.move(to: CGPoint(x: 83, y: 50))
                                p.addCurve(to: CGPoint(x: 81, y: 35), control1: CGPoint(x: 81, y: 44), control2: CGPoint(x: 80, y: 38))
                                p.addCurve(to: CGPoint(x: 92, y: 43), control1: CGPoint(x: 85, y: 37), control2: CGPoint(x: 90, y: 40))
                            }.stroke(.blue, style: StrokeStyle(lineWidth: 2.8, lineCap: .round, lineJoin: .round))
                        }
                    }
                }.frame(width: 200, height: 150)
                Text(name).font(.title2.bold())
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }.padding(20).frame(maxWidth: .infinity, minHeight: 250)
                .background(.white, in: RoundedRectangle(cornerRadius: 24))
        }
        .buttonStyle(.plain)
        .contentShape(RoundedRectangle(cornerRadius: 24))
        .foregroundStyle(.indigo)
    }
}
