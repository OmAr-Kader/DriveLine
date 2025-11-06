//
//  Array.swift
//  DriveLine
//
//  Created by OmAr Kader on 05/11/2025.
//

import Foundation

extension Array {
    
    /// Returns a new array with one element updated if it matches the `find` condition.
    /// - Parameters:
    ///   - find: A closure that takes an element and returns true if it should be updated.
    ///   - edit: A closure that takes the found element and returns the updated version.
    /// - Returns: A new array with the modified element (if found), otherwise the original array.
    func editItem(
        where find: @escaping @Sendable (Element) -> Bool,
        edit: @escaping @Sendable (inout Element) -> Void
    ) -> [Element] {
        // Make a copy of the array (immutability friendly)
        var newArray = self
        
        // Find the index of the matching element
        guard let index = newArray.firstIndex(where: find) else {
            // If nothing found, return as-is
            return self
        }
        
        // Apply the edit closure to the found element
        edit(&newArray[index])
        
        // Replace in the copied array
        //newArray[index] = updatedElement
        
        return newArray
    }
}

