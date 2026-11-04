import SwiftUI

/// Compact floating 3+2 arrangement for narrow windows, not a full-width footer.
struct DockLayout: Layout {
    let columns: Int
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = (subviews.count + columns - 1) / columns
        return CGSize(width: CGFloat(columns * 64 - 4), height: CGFloat(rows * 64 - 4))
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (index, view) in subviews.enumerated() {
            view.place(at: CGPoint(x: bounds.minX + CGFloat(index % columns * 64),
                                   y: bounds.minY + CGFloat(index / columns * 64)),
                       anchor: .topLeading, proposal: ProposedViewSize(width: 60, height: 60))
        }
    }
}
