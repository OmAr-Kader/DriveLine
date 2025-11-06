import Foundation
import SwiftUISturdy

public enum Cloud<T> : @unchecked Sendable {
    case success(T)
    case failure(String)
    case loading
}
