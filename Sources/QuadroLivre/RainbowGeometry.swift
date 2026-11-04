import Foundation

/// Distance is measured only in board coordinates, never time, speed or zoom.
struct RainbowSampler {
    struct Segment {
        let start: CGPoint
        let end: CGPoint
        let distance: CGFloat
    }
    static let spacing: CGFloat = 3
    static let cycle: CGFloat = 360
    private(set) var distance: CGFloat = 0
    private var last: CGPoint?
    private var emitted: CGPoint?
    private var remainder: CGFloat = 0

    mutating func begin(_ point: CGPoint) {
        last = point
        emitted = point
        distance = 0
        remainder = 0
    }

    mutating func append(_ point: CGPoint) -> [Segment] {
        guard var cursor = last, let previous = emitted else { begin(point); return [] }
        var result: [Segment] = []
        var start = previous
        var length = hypot(point.x - cursor.x, point.y - cursor.y)
        while length + remainder >= Self.spacing, length > 0 {
            let needed = Self.spacing - remainder
            let ratio = needed / length
            let next = CGPoint(x: cursor.x + (point.x - cursor.x) * ratio,
                               y: cursor.y + (point.y - cursor.y) * ratio)
            result.append(Segment(start: start, end: next, distance: distance))
            distance += Self.spacing
            remainder = 0
            cursor = next
            start = next
            length = hypot(point.x - cursor.x, point.y - cursor.y)
        }
        remainder += length
        emitted = start
        last = point
        return result
    }

    mutating func finish() -> Segment? {
        guard let start = emitted, let end = last else { return nil }
        defer { last = nil; emitted = nil }
        // A stationary stylus produces one dot without advancing its color.
        guard remainder > 0 || distance == 0 else { return nil }
        return Segment(start: start, end: end, distance: distance)
    }

    static func color(at distance: CGFloat) -> PaletteColor {
        let colors: [PaletteColor] = [
            .init(red: 1, green: 0.12, blue: 0.18), .init(red: 1, green: 0.55, blue: 0.05),
            .init(red: 1, green: 0.85, blue: 0.05), .init(red: 0.15, green: 0.7, blue: 0.25),
            .init(red: 0.1, green: 0.5, blue: 1), .init(red: 0.35, green: 0.2, blue: 0.85),
            .init(red: 0.75, green: 0.15, blue: 0.8)
        ]
        let progress = (max(0, distance).truncatingRemainder(dividingBy: cycle) / cycle) * CGFloat(colors.count)
        let index = Int(progress)
        let fraction = Double(progress - CGFloat(index))
        let a = colors[index], b = colors[(index + 1) % colors.count]
        return PaletteColor(red: a.red + (b.red - a.red) * fraction,
                            green: a.green + (b.green - a.green) * fraction,
                            blue: a.blue + (b.blue - a.blue) * fraction)
    }
}
