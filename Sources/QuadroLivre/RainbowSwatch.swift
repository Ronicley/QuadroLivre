import SwiftUI

struct RainbowSwatch: View {
    var body: some View {
        Circle().fill(AngularGradient(colors: [.red, .orange, .yellow, .green, .blue, .purple, .red], center: .center))
            .overlay(Circle().stroke(.gray.opacity(0.4), lineWidth: 1))
    }
}
