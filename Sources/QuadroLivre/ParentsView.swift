import SwiftUI
import UIKit

/// A child gate, not authentication or a security boundary.
struct ParentGate: View {
    let onSuccess: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var answer = ""
    @State private var first = Int.random(in: 12...19)
    @State private var second = Int.random(in: 6...9)
    @State private var incorrect = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "person.crop.circle.badge.checkmark").font(.system(size: 60)).foregroundStyle(.indigo)
                Text("Área dos responsáveis").font(.title.bold())
                Text("Para continuar, quanto é \(first) + \(second)?")
                TextField("Resposta", text: $answer).keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder).frame(maxWidth: 180)
                    .accessibilityLabel("Resposta da soma")
                if incorrect { Text("Tente novamente.").foregroundStyle(.red) }
                Button("Continuar") {
                    if Int(answer) == first + second { onSuccess() }
                    else { incorrect = true; answer = "" }
                }.buttonStyle(.borderedProminent).controlSize(.large)
                Text("Esta etapa evita acessos acidentais; não é uma senha.")
                    .font(.footnote).foregroundStyle(.secondary)
            }.padding(24)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Voltar") { dismiss() } } }
        }
    }
}

private struct ExportItem: Identifiable {
    let id = UUID()
    let url: URL
}

struct ParentsView: View {
    @ObservedObject var model: CanvasModel
    @Environment(\.dismiss) private var dismiss
    @State private var deleteTarget: Board?
    @State private var exportItem: ExportItem?

    var body: some View {
        NavigationStack {
            List {
                Section("Desenho atual") {
                    Label(model.status, systemImage: "externaldrive.badge.checkmark")
                    Button("Salvar agora", systemImage: "externaldrive") { model.flush() }
                    Button("Compartilhar PNG", systemImage: "square.and.arrow.up") {
                        if let url = model.exportPNG() { exportItem = ExportItem(url: url) }
                    }.disabled(model.currentID == nil)
                }
                Section("Coleção V1.2") {
                    if case .success(let catalog) = IllustrationAssets.catalog {
                        Label("\(catalog.items.count) temas em dois modos", systemImage: "books.vertical")
                        Text("Dez categorias, tudo offline. Seguir contorno usa guia claro; Colorir mantém as linhas protegidas acima da pintura manual, sem balde.")
                        if catalog.stage == "catalog-awaiting-approval" {
                            Text("Os seis pilotos foram aprovados. As outras 94 artes aguardam sua revisão final; já estão disponíveis para experimentar.")
                                .font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    Text("Versão \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—") (\(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"))")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section("Caneta e navegação") {
                    Text("O quadro aceita apenas canetas reconhecidas como stylus pelo iPadOS. Os dedos podem tocar nos botões, mas não desenham.")
                    Text(model.inputStatus).foregroundStyle(.secondary)
                    Text("Teste a WB: faça um traço, apoie a palma e tente desenhar com um dedo. A compatibilidade deste modelo precisa ser validada no iPad real.")
                    Text("Use dois dedos para mover e ampliar. O botão de mão ativa um modo de movimentação com um dedo; toque na canetinha para voltar a desenhar.")
                    Text("O quadro tem uma área de 16.384 × 16.384 pontos. A exportação enquadra o desenho em PNG com até 2.048 pixels no maior lado.")
                }
                Section("Prova técnica V1.1 — não aprovada") {
                    Toggle("Habilitar arco-íris experimental nesta sessão", isOn: $model.rainbowPrototypeEnabled)
                    Text("Desativado por padrão. Habilitar adiciona uma amostra multicolorida à paleta. Teste somente acompanhado: preview, pontas, três espessuras, zoom, borracha parcial, desfazer/refazer, salvar, reabrir e PNG. Ainda não validado quanto a latência e palma; não usar como recurso aprovado para a criança.")
                        .font(.footnote)
                }
                Section("Excluir quadros") {
                    ForEach(model.boards) { board in
                        HStack {
                            BoardPreview(board: board).frame(width: 80, height: 60)
                            VStack(alignment: .leading) {
                                Text(board.id == model.currentID ? "Quadro atual" : "Quadro salvo")
                                Text(board.modified, style: .date).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Button(role: .destructive) { deleteTarget = board } label: {
                                Image(systemName: "trash").frame(width: 60, height: 60)
                            }.buttonStyle(.borderless).accessibilityLabel("Excluir quadro")
                        }
                    }
                }
                Section("Privacidade") {
                    Text("Sem anúncios, cadastro, compras ou envio automático de desenhos. Os quadros ficam neste iPad e podem fazer parte de seu backup do sistema. Compartilhar só ocorre por sua ação.")
                    Text("Apagar o aplicativo pode apagar seus quadros. Exporte imagens ou preserve os arquivos editáveis pelo compartilhamento de arquivos do Apple Devices.")
                }
            }
            .safeAreaInset(edge: .top) { SaveErrorBanner(model: model) }
            .navigationTitle("Responsáveis")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Concluir") { dismiss() } } }
            .alert("Excluir este quadro?", isPresented: Binding(
                get: { deleteTarget != nil }, set: { if !$0 { deleteTarget = nil } }
            )) {
                Button("Excluir", role: .destructive) {
                    if let board = deleteTarget { model.delete(board.id) }
                    deleteTarget = nil
                }
                Button("Cancelar", role: .cancel) { deleteTarget = nil }
            } message: { Text("Essa ação não pode ser desfeita. Outros quadros serão preservados.") }
            .sheet(item: $exportItem) { item in ShareSheet(url: item.url) }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
