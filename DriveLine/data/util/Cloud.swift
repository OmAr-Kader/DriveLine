//
//  Cloud.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy

public enum Cloud<T> : @unchecked Sendable {
    case success(T)
    case failure(String)
    case loading
}

@BackgroundActor
struct BaseResponse: Codable {
    let message: String
}
