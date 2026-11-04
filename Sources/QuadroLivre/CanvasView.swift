import SwiftUI
import PencilKit

/// A noninteractive sibling below PencilKit, transformed from the exact same
/// board coordinates on every scroll/zoom/layout. Never part of editable ink.
final class CanvasHost: UIView {
    let model: CanvasModel
    private let template = UIImageView()
    private var presentation: BoardMetadata?
    private var rainbowGesture: RainbowGesture?

    init(model: CanvasModel) {
        self.model = model
        super.init(frame: .zero)
        backgroundColor = .white
        clipsToBounds = true
        template.isUserInteractionEnabled = false
        template.contentMode = .scaleToFill
        addSubview(template)
        addSubview(model.canvas)
        let gesture = RainbowGesture(model: model, host: self)
        rainbowGesture = gesture
        model.canvas.addGestureRecognizer(gesture)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    override func layoutSubviews() {
        super.layoutSubviews()
        guard model.canvas.superview === self else { return }
        model.canvas.frame = bounds
        synchronize()
    }
    func synchronize() {
        guard model.canvas.superview === self else { return }
        if rainbowGesture?.isEnabled != model.rainbowActive { rainbowGesture?.isEnabled = model.rainbowActive }
        let value = model.metadata.template
        if presentation?.template != value || presentation?.kind != model.metadata.kind {
            presentation = model.metadata
            template.image = model.metadata.protectedImage
        }
        template.alpha = model.metadata.templateOpacity
        if model.metadata.contoursAboveInk { bringSubviewToFront(template) }
        else { sendSubviewToBack(template) }
        guard let value else { template.isHidden = true; return }
        template.isHidden = false
        let canvas = model.canvas
        let scale = canvas.zoomScale
        template.frame = CGRect(x: value.rect.minX * scale - canvas.contentOffset.x,
                                y: value.rect.minY * scale - canvas.contentOffset.y,
                                width: value.rect.width * scale, height: value.rect.height * scale)
    }
}

struct CanvasView: UIViewRepresentable {
    @ObservedObject var model: CanvasModel
    func makeCoordinator() -> Coordinator { Coordinator(model: model) }
    func makeUIView(context: Context) -> CanvasHost {
        let host = CanvasHost(model: model)
        context.coordinator.host = host
        model.canvas.delegate = context.coordinator
        model.canvas.becomeFirstResponder()
        context.coordinator.observeHistory()
        let id = model.currentID
        DispatchQueue.main.async {
            guard model.currentID == id else { return }
            model.restoreViewport()
        }
        return host
    }
    func updateUIView(_ view: CanvasHost, context: Context) { view.synchronize() }

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        let model: CanvasModel
        weak var host: CanvasHost?
        private var observers: [NSObjectProtocol] = []
        init(model: CanvasModel) { self.model = model }
        func scrollViewDidScroll(_ scrollView: UIScrollView) {
            guard scrollView === model.canvas else { return }
            host?.synchronize(); model.viewportChanged()
        }
        func scrollViewDidZoom(_ scrollView: UIScrollView) {
            guard scrollView === model.canvas else { return }
            host?.synchronize(); model.viewportChanged()
        }
        func observeHistory() {
            for name in [Notification.Name.NSUndoManagerDidUndoChange,
                         Notification.Name.NSUndoManagerDidRedoChange,
                         Notification.Name.NSUndoManagerDidCloseUndoGroup] {
                observers.append(NotificationCenter.default.addObserver(
                    forName: name, object: model.canvas.undoManager, queue: .main
                ) { [weak self] _ in
                    DispatchQueue.main.async { self?.model.refreshHistory() }
                })
            }
        }
        deinit { observers.forEach { NotificationCenter.default.removeObserver($0) } }
        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            guard canvasView === model.canvas else { return }
            model.changed()
        }
        func canvasViewDidBeginUsingTool(_ canvasView: PKCanvasView) {
            guard canvasView === model.canvas else { return }
            model.inputStatus = "Traço recebido no modo somente caneta"
        }
        func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
            guard canvasView === model.canvas else { return }
            model.refreshHistory()
        }
    }
}
