import UIKit
import PencilKit

/// Opt-in technical proof, NOT enabled for normal child sessions.
/// Preview appends small shape layers; PKDrawing is constructed once at gesture end.
/// This intentionally exposes the performance/eraser/history tests before approval.
final class RainbowGesture: UIGestureRecognizer {
    weak var model: CanvasModel?
    weak var host: CanvasHost?
    private var pencil: UITouch?
    private var sampler = RainbowSampler()
    private var segments: [RainbowSampler.Segment] = []
    private var base = PKDrawing()
    private var width: CGFloat = 9
    private let preview = CALayer()

    init(model: CanvasModel, host: CanvasHost) {
        self.model = model
        self.host = host
        super.init(target: nil, action: nil)
        allowedTouchTypes = [NSNumber(value: UITouch.TouchType.pencil.rawValue)]
        cancelsTouchesInView = true
        isEnabled = false
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        guard pencil == nil, let touch = touches.first(where: { $0.type == .pencil }),
              let model, let host, model.rainbowActive else { state = .failed; return }
        pencil = touch
        model.rainbowInProgress = true
        base = model.canvas.drawing
        width = [4, 9, 18][model.sizeIndex]
        sampler.begin(boardPoint(touch))
        segments.removeAll(keepingCapacity: true)
        preview.sublayers?.forEach { $0.removeFromSuperlayer() }
        preview.frame = host.bounds
        host.layer.addSublayer(preview)
        model.inputStatus = "Prova arco-íris: caneta reconhecida pelo sistema"
        state = .began
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let pencil, touches.contains(pencil) else { return }
        for touch in event.coalescedTouches(for: pencil) ?? [pencil] {
            append(sampler.append(boardPoint(touch)))
        }
        state = .changed
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let pencil, touches.contains(pencil), let model else { return }
        append(sampler.append(boardPoint(pencil)))
        if let final = sampler.finish() { append([final]) }
        let date = Date()
        let strokes = segments.map { segment in
            let color = RainbowSampler.color(at: segment.distance)
            let start = segment.start
            var end = segment.end
            if start == end { end.x += 0.01 }
            let points = [start, end].enumerated().map { index, point in
                PKStrokePoint(location: point, timeOffset: Double(index) * 0.01,
                              size: CGSize(width: width, height: width), opacity: 1,
                              force: 1, azimuth: 0, altitude: .pi / 2)
            }
            return PKStroke(ink: PKInk(.pen, color: UIColor(red: color.red, green: color.green, blue: color.blue, alpha: 1)),
                            path: PKStrokePath(controlPoints: points, creationDate: date))
        }
        model.rainbowInProgress = false
        model.commitRainbow(PKDrawing(strokes: base.strokes + strokes), previous: base)
        preview.removeFromSuperlayer()
        self.pencil = nil
        state = .ended
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
        preview.removeFromSuperlayer()
        pencil = nil
        model?.rainbowInProgress = false
        segments.removeAll()
        state = .cancelled
    }

    override func reset() {
        super.reset()
        model?.rainbowInProgress = false
        preview.removeFromSuperlayer()
        pencil = nil
        segments.removeAll()
    }

    private func boardPoint(_ touch: UITouch) -> CGPoint {
        guard let canvas = model?.canvas else { return .zero }
        // UIScrollView's bounds origin already incorporates contentOffset.
        let point = touch.location(in: canvas)
        return CGPoint(x: point.x / canvas.zoomScale, y: point.y / canvas.zoomScale)
    }

    private func append(_ values: [RainbowSampler.Segment]) {
        guard let canvas = model?.canvas else { return }
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        for value in values {
            segments.append(value)
            let color = RainbowSampler.color(at: value.distance)
            let path = UIBezierPath()
            func screen(_ point: CGPoint) -> CGPoint {
                CGPoint(x: point.x * canvas.zoomScale - canvas.contentOffset.x,
                        y: point.y * canvas.zoomScale - canvas.contentOffset.y)
            }
            path.move(to: screen(value.start))
            var end = screen(value.end)
            if value.start == value.end { end.x += 0.01 }
            path.addLine(to: end)
            let layer = CAShapeLayer()
            layer.path = path.cgPath
            layer.lineWidth = width * canvas.zoomScale
            layer.lineCap = .round
            layer.strokeColor = UIColor(red: color.red, green: color.green, blue: color.blue, alpha: 1).cgColor
            layer.fillColor = nil
            preview.addSublayer(layer)
        }
        CATransaction.commit()
    }
}
