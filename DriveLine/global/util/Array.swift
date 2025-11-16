//
//  Array.swift
//  DriveLine
//
//  Created by OmAr Kader on 15/11/2025.
//

import Foundation

public extension Array {

    /// Returns the first element in the array that satisfies the given predicate,
    /// or throws an error if no such element exists.
    ///
    /// - Parameter predicate: A closure that takes an element of the array and
    ///   returns `true` if the element matches the condition.
    /// - Throws: An `NSError` with domain `"No element found"` if no element
    ///   satisfies the predicate.
    /// - Returns: The first element that matches the predicate.
    ///
    /// This is useful when you want to ensure that a matching element must exist,
    /// rather than dealing with an optional result from `first(where:)`.
    @inlinable
    func firstOrThrow(where predicate: (Element) throws -> Bool) throws -> Element {
      if let first = try first(where: predicate) {
        return first
      }
      throw NSError(domain: "No element found", code: 1, userInfo: nil)
    }
}
