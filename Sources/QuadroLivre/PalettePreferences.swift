import Foundation

struct PaletteColor: Codable, Equatable, Sendable {
    let red: Double
    let green: Double
    let blue: Double
    var valid: Bool { [red, green, blue].allSatisfy { $0.isFinite && (0...1).contains($0) } }
}

struct PalettePreferences: Codable, Equatable {
    let version: Int
    var slots: [PaletteColor?]
    static let empty = PalettePreferences(version: 1, slots: [nil, nil, nil])
    static let key = "palette.v1"
    var valid: Bool {
        version == 1 && slots.count == 3 && slots.compactMap { $0 }.allSatisfy(\.valid) &&
        Set(slots.compactMap { $0 }.map { "\($0.red),\($0.green),\($0.blue)" }).count == slots.compactMap { $0 }.count
    }

    /// A duplicate selects its existing slot, without replacing the edited slot.
    mutating func choose(_ color: PaletteColor, at index: Int) -> Int {
        guard color.valid, slots.indices.contains(index) else { return index }
        if let existing = slots.firstIndex(where: { $0 == color }) { return existing }
        slots[index] = color
        return index
    }

    static func load(from defaults: UserDefaults = .standard) throws -> Self {
        guard let data = defaults.data(forKey: key) else { return .empty }
        let value = try JSONDecoder().decode(Self.self, from: data)
        guard value.valid else { throw CocoaError(.coderReadCorrupt) }
        return value
    }

    func save(to defaults: UserDefaults = .standard) throws {
        guard valid else { throw CocoaError(.coderInvalidValue) }
        defaults.set(try JSONEncoder().encode(self), forKey: Self.key)
    }

    // Families in columns, light/medium/dark tones in rows; entirely visual.
    static let curated: [PaletteColor] = [
        [0xFFB3BA, 0xFFD0AA, 0xFFF3A6, 0xC5ECAA, 0xA5E4DB, 0xACD8FF, 0xD3B7F0, 0xE4C6AA],
        [0xEF6F9C, 0xECA15C, 0xDCC84B, 0x6BAE55, 0x28ABA1, 0x568BCD, 0xA36AC2, 0xAB7857],
        [0xA62E57, 0xAE5825, 0x98851B, 0x32652D, 0x12645F, 0x234C89, 0x613C82, 0x63432F]
    ].flatMap { row in row.map { hex in
        PaletteColor(red: Double((hex >> 16) & 255) / 255,
                     green: Double((hex >> 8) & 255) / 255,
                     blue: Double(hex & 255) / 255)
    } }
}
