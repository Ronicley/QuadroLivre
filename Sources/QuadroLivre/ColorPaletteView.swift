import SwiftUI

struct ColorPaletteView: View {
    @ObservedObject var model: CanvasModel
    let close: () -> Void
    @State private var editing: Int?
    private let columns = Array(repeating: GridItem(.fixed(60), spacing: 8), count: 4)

    var body: some View {
        ScrollView {
        VStack(spacing: 12) {
            if let editing {
                HStack {
                    Button { self.editing = nil } label: {
                        Image(systemName: "arrow.left").frame(width: 60, height: 60)
                    }.accessibilityLabel("Voltar às cores")
                    Spacer()
                    Image(systemName: "paintpalette.fill").font(.largeTitle).foregroundStyle(.indigo)
                    Spacer()
                }
                // Four columns keep every target >= 60pt even in compact windows.
                LazyVGrid(columns: columns, spacing: 4) {
                    ForEach(PalettePreferences.curated.indices, id: \.self) { index in
                        let color = PalettePreferences.curated[index]
                        swatch(UIColor(red: color.red, green: color.green, blue: color.blue, alpha: 1),
                               label: "Cor extra, tom \(index + 1)", selected: model.palette.slots[editing] == color) {
                            model.chooseExtra(color, at: editing)
                            close()
                        }
                    }
                }
            } else {
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(CanvasModel.colors.indices, id: \.self) { index in
                        swatch(CanvasModel.colors[index], label: CanvasModel.colorNames[index],
                               selected: !model.rainbow && model.extraColorIndex == nil && model.colorIndex == index) {
                            model.selectColor(fixed: index); close()
                        }
                    }
                }
                HStack(spacing: 8) {
                    ForEach(0..<3) { index in
                        VStack(spacing: 0) {
                            if let color = model.palette.slots[index] {
                                swatch(UIColor(red: color.red, green: color.green, blue: color.blue, alpha: 1),
                                       label: "Cor extra \(index + 1)", selected: !model.rainbow && model.extraColorIndex == index) {
                                    model.selectColor(extra: index); close()
                                }
                                Button { editing = index } label: {
                                    Image(systemName: "pencil.circle.fill").font(.title2).frame(width: 60, height: 60)
                                }.accessibilityLabel("Trocar cor extra \(index + 1)")
                            } else {
                                Button { editing = index } label: {
                                    Image(systemName: "plus.circle.dashed").font(.system(size: 36))
                                        .frame(width: 60, height: 60)
                                }.accessibilityLabel("Adicionar cor extra \(index + 1)")
                            }
                        }
                    }
                }
                if model.rainbowPrototypeEnabled {
                    Button { model.selectRainbow(); close() } label: {
                        RainbowSwatch().frame(width: 44, height: 44).frame(width: 60, height: 60)
                    }.accessibilityLabel("Arco-íris experimental")
                }
            }
        }
        .padding(16)
        }
        .frame(width: 312)
        .frame(maxHeight: 560)
    }

    private func swatch(_ color: UIColor, label: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Circle().fill(Color(uiColor: color)).frame(width: 40, height: 40)
                .overlay(Circle().stroke(.gray.opacity(0.4), lineWidth: 1))
                .frame(width: 60, height: 60)
                .background(selected ? Color.indigo.opacity(0.15) : .clear, in: RoundedRectangle(cornerRadius: 18))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(selected ? .indigo : .clear, lineWidth: 3))
        }.buttonStyle(.plain).accessibilityLabel(label)
            .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
