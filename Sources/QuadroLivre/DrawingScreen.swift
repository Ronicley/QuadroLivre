import SwiftUI

struct DrawingScreen: View {
    @ObservedObject var model: CanvasModel
    @State private var gallery = false
    @State private var newActivity = false
    @State private var sizes = false
    @State private var palette = false
    @State private var more = false
    @State private var parentGate = false
    @State private var parents = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                CanvasView(model: model)
                    .id(model.currentID)
                    .allowsHitTesting(model.currentID != nil)
                    .accessibilityLabel("Quadro de desenho. Use a caneta para desenhar e dois dedos para mover.")
                VStack {
                    HStack {
                        toolButton("Meus desenhos", icon: "square.grid.2x2.fill", tint: .indigo) {
                            if model.flush() { gallery = true }
                        }
                        toolButton("Novo desenho", icon: "plus", tint: .indigo) {
                            if model.flush() { newActivity = true }
                        }
                        Spacer()
                        toolButton("Reenquadrar", icon: "viewfinder", tint: .teal) { model.fitDrawing() }
                    }
                    Spacer()
                }.padding(12)
                VStack {
                    Spacer()
                    HStack {
                        if geometry.size.width < 356 { Spacer() }
                        dock(vertical: geometry.size.width < 356)
                    }
                }.padding(12)
            }
            .onAppear { updateMargins(geometry.size) }
            .onChange(of: geometry.size) { old, new in
                updateMargins(new)
                guard old.width > 0, old.height > 0 else { return }
                let canvas = model.canvas
                let offset = CGPoint(x: canvas.contentOffset.x + (old.width - new.width) / 2,
                                     y: canvas.contentOffset.y + (old.height - new.height) / 2)
                DispatchQueue.main.async {
                    canvas.setContentOffset(CGPoint(
                        x: min(max(-canvas.contentInset.left, offset.x), max(-canvas.contentInset.left, canvas.contentSize.width - new.width + canvas.contentInset.right)),
                        y: min(max(-canvas.contentInset.top, offset.y), max(-canvas.contentInset.top, canvas.contentSize.height - new.height + canvas.contentInset.bottom))
                    ), animated: false)
                }
            }
        }
        .background(.white)
        .onAppear { newActivity = true }
        .sheet(isPresented: $newActivity) {
            NewBoardView(model: model) { newActivity = false }
                .interactiveDismissDisabled(model.currentID == nil)
        }
        .sheet(isPresented: $gallery) { GalleryView(model: model) }
        .sheet(isPresented: $parentGate) {
            ParentGate {
                parentGate = false
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { parents = true }
            }
        }
        .sheet(isPresented: $parents) { ParentsView(model: model) }
        .alert("Precisamos de um responsável", isPresented: Binding(
            get: { model.errorMessage != nil && !newActivity && !gallery && !parents && !parentGate },
            set: { if !$0 { model.errorMessage = nil } }
        )) {
            Button("Tentar novamente") { model.retrySave() }
            Button("Fechar", role: .cancel) { model.errorMessage = nil }
        } message: { Text(model.errorMessage ?? "") }
    }

    private func updateMargins(_ size: CGSize) {
        model.protectedInsets = size.width < 356
            ? UIEdgeInsets(top: 84, left: 20, bottom: 168, right: 20)
            : UIEdgeInsets(top: 84, left: 20, bottom: 104, right: 20)
    }

    private func dock(vertical: Bool) -> some View {
        let layout = AnyLayout(DockLayout(columns: vertical ? 3 : 5))
        return layout {
            Button { palette = true } label: {
                Group {
                    if model.rainbow { RainbowSwatch() }
                    else {
                        Circle().fill(Color(uiColor: model.currentColor))
                            .overlay(Circle().stroke(.gray.opacity(0.5), lineWidth: 1))
                    }
                }.frame(width: 36, height: 36)
                    .frame(width: 60, height: 60).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel("Escolher cor")
                .popover(isPresented: $palette) {
                    ColorPaletteView(model: model) { palette = false }
                        .presentationCompactAdaptation(.popover)
                }
            toolButton("Canetinha; toque novamente para espessuras", icon: "pencil.tip", tint: .indigo,
                       selected: !model.erasing && !model.moveMode) {
                if !model.erasing && !model.moveMode { sizes = true }
                else { model.erasing = false; model.moveMode = false }
            }
            .overlay(alignment: .bottomTrailing) {
                Image(systemName: "chevron.down").font(.caption2.bold()).padding(5).allowsHitTesting(false)
            }
            .popover(isPresented: $sizes) {
                HStack(spacing: 12) {
                    ForEach(0..<3) { index in
                        Button {
                            model.sizeIndex = index
                            sizes = false
                        } label: {
                            Circle().fill(.indigo)
                                .frame(width: CGFloat(10 + index * 12), height: CGFloat(10 + index * 12))
                                .frame(width: 60, height: 60)
                                .background(model.sizeIndex == index ? Color.indigo.opacity(0.15) : .clear,
                                            in: RoundedRectangle(cornerRadius: 18))
                        }.accessibilityLabel(["Traço fino", "Traço médio", "Traço grosso"][index])
                    }
                }.padding(20).presentationCompactAdaptation(.popover)
            }
            toolButton("Borracha", icon: "eraser.fill", tint: .pink, selected: model.erasing) {
                model.moveMode = false; model.erasing = true
            }
            toolButton("Desfazer", icon: "arrow.uturn.backward", tint: .indigo) { model.undo() }
                .disabled(!model.canUndo)
            toolButton("Mais opções", icon: model.moveMode ? "hand.draw.fill" : "ellipsis",
                       tint: model.moveMode ? .teal : .indigo, selected: model.moveMode) { more = true }
                .popover(isPresented: $more) {
                    HStack(spacing: 12) {
                        toolButton("Refazer", icon: "arrow.uturn.forward", tint: .indigo) { model.redo(); more = false }
                            .disabled(!model.canRedo)
                        toolButton("Mover quadro", icon: "hand.draw.fill", tint: .teal, selected: model.moveMode) {
                            model.moveMode.toggle(); more = false
                        }
                        toolButton("Área dos responsáveis", icon: "lock.fill", tint: .secondary) {
                            more = false
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { parentGate = true }
                        }
                    }.padding(20).presentationCompactAdaptation(.popover)
                }
        }
        .padding(8)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 26))
        .overlay(RoundedRectangle(cornerRadius: 26).stroke(.gray.opacity(0.2)))
    }
}

func toolButton(_ label: String, icon: String, tint: Color, selected: Bool = false,
                action: @escaping () -> Void) -> some View {
    Button(action: action) {
        Image(systemName: icon).font(.system(size: 26, weight: .semibold))
            .foregroundStyle(tint)
            .frame(width: 60, height: 60)
            .background(selected ? tint.opacity(0.16) : Color.white.opacity(0.9),
                        in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected ? tint : .clear, lineWidth: 3))
            .contentShape(RoundedRectangle(cornerRadius: 20))
    }
    .buttonStyle(.plain).accessibilityLabel(label)
    .accessibilityAddTraits(selected ? .isSelected : [])
}
