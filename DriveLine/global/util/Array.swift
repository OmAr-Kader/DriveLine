//
//  Array.swift
//  DriveLine
//
//  Created by OmAr Kader on 15/11/2025.
//

import Foundation

extension Array {

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
    public func firstOrThrow(where predicate: (Element) throws -> Bool) throws -> Element {
      if let first = try first(where: predicate) {
        return first
      }
      throw NSError(domain: "No element found", code: 1, userInfo: nil)
    }
    
    /// Returns a new array with duplicate elements removed based on a custom key.
    ///
    /// Use this method when you want to keep only the first occurrence of each element
    /// according to a specific property or computed value. The order of elements is preserved.
    ///
    /// - Parameter key: A closure that returns a hashable value used to determine uniqueness.
    /// - Returns: An array containing only the first occurrence of each unique key.
    @inlinable
    public nonisolated func unique<T: Hashable>(by key: (Element) -> T) -> [Element] {
        var seen = Set<T>()
        return self.filter { element in
            let k = key(element)
            if seen.contains(k) {
                return false
            } else {
                seen.insert(k)
                return true
            }
        }
    }
}
