import Foundation
import SwiftUISturdy

struct Const : Sendable {
    
    nonisolated static let SCHEMA_VERSION: UInt64 = 0
    
    nonisolated static let PREF_USER_ID: String = "userId"
    nonisolated static let PREF_USER_NAME: String = "userName"
    nonisolated static let PREF_USER_EMAIL: String = "userEmail"
    nonisolated static let PREF_USER_TYPE: String = "userType"
    nonisolated static let PREF_USER_TOKEN: String = "token"

    nonisolated static let CLOUD_SUCCESS = 1
    nonisolated static let CLOUD_FAILED = 0

    nonisolated static let USER_TYPE_CLIENT = "client"
    nonisolated static let USER_TYPE_MECHANIC = "mechanic"
    
    nonisolated static let GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    nonisolated static let GEMINI_MODEL : String = "gemini-2.5-flash"

}

