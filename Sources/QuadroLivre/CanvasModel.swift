import SwiftUI
import PencilKit

@MainActor
final class CanvasModel: ObservableObject {
    static let boardSize: CGFloat = 16_384
    static let colors: [UIColor] = [.systemRed, .systemOrange, .systemYellow, .systemGreen,
                                    .systemBlue, .systemPurple, .black, .white]
    static let colorNames = ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul", "Roxo", "Preto", "Branco"]
    private(set) var canvas = PKCanvasView()
    @Published private(set) var metadata = BoardMetadata.free
    @Published var needsActivityChoice = false
    @Published private(set) var palette = PalettePreferences.empty
    @Published var rainbowPrototypeEnabled = false {
        didSet { if !rainbowPrototypeEnabled { rainbow = false }; updateTool() }
    }
    @Published var rainbow = false { didSet { updateTool() } }
    var rainbowActive: Bool { rainbowPrototypeEnabled && rainbow && !erasing && !moveMode }
    var rainbowInProgress = false
    @Published var extraColorIndex: Int?
    @Published var colorIndex = 4 { didSet { updateTool() } }
    var currentColor: UIColor {
        if let index = extraColorIndex, let color = palette.slots[index] {
            return UIColor(red: color.red, green: color.green, blue: color.blue, alpha: 1)
        }
        return Self.colors[colorIndex]
    }
    var protectedInsets = UIEdgeInsets(top: 84, left: 20, bottom: 104, right: 20) {
        didSet { canvas.contentInset = protectedInsets }
    }
    @Published var sizeIndex = 1 { didSet { updateTool() } }
    @Published var erasing = false { didSet { updateTool() } }
    @Published var moveMode = false { didSet { updateTool() } }
    @Published var canUndo = false
    @Published var canRedo = false
    @Published var boards: [Board] = []
    @Published var errorMessage: String?
    @Published var status = "Pronto para desenhar"
    @Published var inputStatus = "Aguardando teste com a caneta"
    @Published private(set) var currentID: UUID?
    private var store: DrawingStore?
    private var pendingSave: DispatchWorkItem?
    private var dirty = false
    private var switching = false
    private var restoringViewport = false
    private var revision = 0
    private let saveQueue = DispatchQueue(label: "com.ronicley.quadrolivre.persistence", qos: .utility)

    private func configureCanvas() {
        canvas.backgroundColor = .clear
        canvas.isOpaque = false
        canvas.overrideUserInterfaceStyle = .light
        canvas.drawingPolicy = .pencilOnly
        canvas.contentSize = CGSize(width: Self.boardSize, height: Self.boardSize)
        canvas.minimumZoomScale = 0.25
        canvas.maximumZoomScale = 3
        canvas.bounces = false
        canvas.bouncesZoom = false
        canvas.contentInsetAdjustmentBehavior = .never
        canvas.contentInset = protectedInsets
        canvas.panGestureRecognizer.minimumNumberOfTouches = 2
    }

    init() {
        configureCanvas()
        do { palette = try PalettePreferences.load() }
        catch { errorMessage = "Não foi possível ler as cores extras. As preferências originais foram preservadas." }
        updateTool()
        recoverStorage()
    }

    func recoverStorage() {
        do {
            store = try DrawingStore()
            try refreshBoards()
            let remembered = UserDefaults.standard.string(forKey: "lastBoard").flatMap(UUID.init(uuidString:))
            if let id = remembered, boards.contains(where: { $0.id == id }) {
                open(id)
            } else if let board = boards.first {
                open(board.id)
            } else {
                needsActivityChoice = true
            }
        } catch { report(error, action: "abrir seus desenhos") }
    }

    func updateTool() {
        if erasing { canvas.tool = PKEraserTool(.bitmap, width: 45) }
        else { canvas.tool = PKInkingTool(.pen, color: currentColor, width: (metadata.kind == "coloring" ? [8.0, 24.0, 60.0] : [4.0, 9.0, 18.0])[sizeIndex]) }
        canvas.drawingGestureRecognizer.isEnabled = !moveMode && !rainbowActive
        // Explicit move mode allows single-finger panning, never finger drawing.
        canvas.panGestureRecognizer.minimumNumberOfTouches = moveMode ? 1 : 2
    }

    func selectColor(fixed: Int? = nil, extra: Int? = nil) {
        rainbow = false
        extraColorIndex = extra
        if let fixed { colorIndex = fixed }
        erasing = false
        moveMode = false
        updateTool()
    }

    func selectRainbow() {
        guard rainbowPrototypeEnabled else { return }
        erasing = false
        moveMode = false
        rainbow = true
    }

    func commitRainbow(_ drawing: PKDrawing, previous: PKDrawing) {
        guard let history = canvas.undoManager else {
            errorMessage = "A prova arco-íris não encontrou histórico de desfazer. O traço de teste não foi adicionado."
            return
        }
        history.registerUndo(withTarget: self) { target in
            target.commitRainbow(previous, previous: drawing)
        }
        history.setActionName("Traço arco-íris")
        canvas.drawing = drawing
        changed()
        DispatchQueue.main.async { [weak self] in self?.refreshHistory() }
    }

    func chooseExtra(_ color: PaletteColor, at index: Int) {
        var next = palette
        let selected = next.choose(color, at: index)
        do {
            try next.save()
            palette = next
            selectColor(extra: selected)
        } catch { report(error, action: "salvar suas cores") }
    }

    func viewportChanged() {
        guard !switching, !restoringViewport, currentID != nil, canvas.bounds.width > 0 else { return }
        let value = BoardViewport(scale: Double(canvas.zoomScale), x: Double(canvas.contentOffset.x), y: Double(canvas.contentOffset.y))
        guard metadata.viewport != value else { return }
        metadata.viewport = value
        changed()
    }

    func restoreViewport() {
        guard canvas.bounds.width > 0, canvas.bounds.height > 0 else { return }
        defer { restoringViewport = false }
        guard let value = metadata.viewport else { fitDrawing(); return }
        switching = true
        canvas.minimumZoomScale = min(canvas.minimumZoomScale, value.scale)
        canvas.setZoomScale(value.scale, animated: false)
        canvas.setContentOffset(CGPoint(x: value.x, y: value.y), animated: false)
        switching = false
    }

    func changed() {
        guard !switching, currentID != nil else { return }
        dirty = true
        revision += 1
        status = "Salvando…"
        refreshHistory()
        pendingSave?.cancel()
        let task = DispatchWorkItem { [weak self] in self?.saveInBackground() }
        pendingSave = task
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6, execute: task)
    }

    private func saveInBackground() {
        guard dirty, let store, let id = currentID else { return }
        let snapshot = canvas.drawing
        let metadata = metadata
        let savedRevision = revision
        saveQueue.async { [weak self] in
            do {
                try store.save(snapshot, id: id, metadata: metadata)
                store.saveThumbnail(snapshot, id: id, metadata: metadata)
                let boards = try store.list()
                DispatchQueue.main.async {
                    guard let self, self.currentID == id, self.revision == savedRevision else { return }
                    self.dirty = false
                    self.boards = boards
                    self.status = "Desenho salvo"
                }
            } catch {
                DispatchQueue.main.async {
                    guard let self, self.currentID == id, self.revision == savedRevision else { return }
                    self.report(error, action: "salvar ou atualizar a galeria. Tente novamente")
                }
            }
        }
    }

    func retrySave() {
        errorMessage = nil
        if currentID == nil { recoverStorage() }
        else { flush() }
    }

    @discardableResult
    func flush() -> Bool {
        guard !rainbowInProgress else {
            errorMessage = "Termine o traço arco-íris antes de trocar ou exportar o quadro."
            return false
        }
        pendingSave?.cancel()
        pendingSave = nil
        guard let store else { return false }
        do {
            // Transitions/backgrounding wait for ordered writes; normal autosaves do not block drawing.
            if dirty, let id = currentID {
                let snapshot = canvas.drawing
                try saveQueue.sync {
                    try store.save(snapshot, id: id, metadata: metadata)
                    store.saveThumbnail(snapshot, id: id, metadata: metadata)
                }
                dirty = false
                status = "Desenho salvo"
            } else {
                saveQueue.sync {} // Wait for pending previews before refreshing the gallery.
            }
            // Retried even if the drawing was saved successfully but listing failed previously.
            try refreshBoards()
            return true
        } catch {
            report(error, action: "salvar ou atualizar a galeria. Não feche o aplicativo; tente novamente")
            return false
        }
    }

    func refreshBoards() throws { boards = try store?.list() ?? [] }

    func newBoard(metadata: BoardMetadata = .free) {
        guard flush(), let store else { return }
        do {
            let id = UUID()
            let drawing = PKDrawing()
            try store.save(drawing, id: id, metadata: metadata)
            store.saveThumbnail(drawing, id: id, metadata: metadata)
            setDrawing(drawing, id: id, metadata: metadata)
            try refreshBoards()
        } catch { report(error, action: "criar outro quadro") }
    }

    func open(_ id: UUID) {
        guard flush(), let store else { return }
        do {
            let loaded = try store.load(id)
            setDrawing(loaded.drawing, id: id, metadata: loaded.metadata)
        }
        catch { report(error, action: "abrir este quadro. O arquivo original foi preservado") }
    }

    private func setDrawing(_ drawing: PKDrawing, id: UUID, metadata: BoardMetadata) {
        switching = true
        restoringViewport = true
        // A document owns its PencilKit view, render state and undo stack.
        // Never reuse cached tiles or an in-flight delegate from the previous board.
        canvas.delegate = nil
        canvas.isUserInteractionEnabled = false
        canvas.resignFirstResponder()
        canvas = PKCanvasView()
        configureCanvas()
        self.metadata = metadata
        rainbow = false
        revision += 1
        canvas.drawing = drawing
        canvas.undoManager?.removeAllActions()
        currentID = id
        UserDefaults.standard.set(id.uuidString, forKey: "lastBoard")
        erasing = false
        moveMode = false
        dirty = false
        switching = false
        status = "Desenho salvo"
        refreshHistory()
        needsActivityChoice = false
        DispatchQueue.main.async { [weak self] in
            guard let self, self.currentID == id else { return }
            self.restoreViewport()
        }
    }

    func undo() { canvas.undoManager?.undo(); refreshHistory() }
    func redo() { canvas.undoManager?.redo(); refreshHistory() }
    func refreshHistory() {
        canUndo = canvas.undoManager?.canUndo ?? false
        canRedo = canvas.undoManager?.canRedo ?? false
    }

    func fitDrawing() {
        guard canvas.bounds.width > 0, canvas.bounds.height > 0 else { return }
        var bounds = canvas.drawing.strokes.isEmpty ? CGRect.null : canvas.drawing.bounds
        if let template = metadata.template { bounds = bounds.union(template.rect) }
        if bounds.isNull { bounds = CGRect(x: Self.boardSize / 2 - 400, y: Self.boardSize / 2 - 300, width: 800, height: 600) }
        let fit = BoardGeometry.fitProtected(content: bounds.insetBy(dx: -32, dy: -32), viewport: canvas.bounds.size,
                                             side: Self.boardSize, top: protectedInsets.top, left: protectedInsets.left,
                                             bottom: protectedInsets.bottom, right: protectedInsets.right)
        canvas.minimumZoomScale = fit.minimumScale
        canvas.setZoomScale(fit.scale, animated: false)
        canvas.setContentOffset(fit.offset, animated: false)
    }

    func delete(_ id: UUID) {
        guard flush(), let store else { return }
        // Prepare a safe replacement before removing the active drawing.
        if id == currentID {
            if let other = boards.first(where: { $0.id != id }) { open(other.id) }
            else { newBoard() }
            guard currentID != id else { return }
        }
        do { try store.delete(id); try refreshBoards() }
        catch { report(error, action: "excluir o quadro") }
    }

    func exportPNG() -> URL? {
        guard flush() else { return nil }
        do {
            guard let data = try DrawingStore.image(canvas.drawing, metadata: metadata, maxDimension: 2048).pngData() else { return nil }
            let directory = FileManager.default.temporaryDirectory.appendingPathComponent("Compartilhar", isDirectory: true)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let url = directory.appendingPathComponent("Desenho-\(UUID().uuidString).png")
            try data.write(to: url, options: .atomic)
            return url
        } catch { report(error, action: "exportar o desenho"); return nil }
    }

    private func report(_ error: Error, action: String) {
        errorMessage = "Não foi possível \(action).\n\(error.localizedDescription)"
        status = "Precisa de ajuda para salvar ou abrir"
    }
}
