import Foundation

/// Pure geometry shared by the canvas and Linux-runnable regression checks.
enum BoardGeometry {
    struct Viewport {
        let minimumScale: CGFloat
        let scale: CGFloat
        let offset: CGPoint
    }

    static func fit(content: CGRect?, viewport: CGSize, side: CGFloat) -> Viewport {
        let width = max(1, viewport.width)
        let height = max(1, viewport.height)
        let minimum = min(0.25, min(width, height) / (side + 200))
        let rect = content ?? CGRect(x: side / 2 - 400, y: side / 2 - 300, width: 800, height: 600)
        let scale = min(1, max(minimum, min(width / max(1, rect.width), height / max(1, rect.height))))
        let offset = CGPoint(
            x: min(max(0, side * scale - width), max(0, rect.midX * scale - width / 2)),
            y: min(max(0, side * scale - height), max(0, rect.midY * scale - height / 2))
        )
        return Viewport(minimumScale: minimum, scale: scale, offset: offset)
    }

    static func fitProtected(content: CGRect, viewport: CGSize, side: CGFloat,
                             top: CGFloat, left: CGFloat, bottom: CGFloat, right: CGFloat) -> Viewport {
        let available = CGSize(width: max(1, viewport.width - left - right),
                               height: max(1, viewport.height - top - bottom))
        let base = fit(content: content, viewport: available, side: side)
        let offset = CGPoint(
            x: min(max(-left, side * base.scale - viewport.width + right), max(-left, content.midX * base.scale - left - available.width / 2)),
            y: min(max(-top, side * base.scale - viewport.height + bottom), max(-top, content.midY * base.scale - top - available.height / 2)))
        return Viewport(minimumScale: min(base.minimumScale, min(viewport.width, viewport.height) / (side + 200)),
                        scale: base.scale, offset: offset)
    }

    static func exportSize(for rect: CGRect, maximum: CGFloat) -> CGSize {
        let scale = min(1, maximum / max(1, max(rect.width, rect.height)))
        return CGSize(width: max(1, ceil(rect.width * scale)), height: max(1, ceil(rect.height * scale)))
    }
}
