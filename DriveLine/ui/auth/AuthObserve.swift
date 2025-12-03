//
//  AuthObserve.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//


import Foundation
import SwiftUI
import Observation
import SwiftUISturdy
import SwiftUIMacroSturdy
import CouchbaseLiteSwift

@Observable
final class AuthAppObserve: BaseObserver {
    
    @MainActor
    private(set) var state: BaseAppObserveState = BaseAppObserveState()

    init() {
        @Inject
        var pro: Project
        super.init(project: pro)
    }
    
    var toast: Binding<Toast?> {
        Binding {
            self.state.toast
        } set: { newValue in
            self.state = self.state.copy(toast: .set(newValue))
        }
    }

    @MainActor
    func register(name: String, email: String, phone: String, password: String, invoke: @escaping @Sendable @MainActor (LoginResponse) -> Void) {
        if let msg = validateUserInput(name: name, email: email, phone: phone, password: password) {
            withAnimation {
                self.state = self.state.copy(toast: .set(Toast(style: .error, message: msg)))
            }
        } else {
            withAnimation {
                self.state = self.state.copy(isLoading: .set(true))
            }
            tasker.back {
                await self.project.auth.register(body: RegisterRequest(name: name, email: email, phone: phone, role: Const.USER_TYPE_MECHANIC, password: password)) { res in
                    await self.project.auth.login(body: LoginRequest(email: email, password: password)) { res in
                        self.mainSync {
                            invoke(res)
                        }
                    } failed: { msg in
                        self.mainSync {
                            withAnimation {
                                self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: msg)))
                            }
                        }
                    }
                } failed: { msg in
                    self.mainSync {
                        withAnimation {
                            self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: msg)))
                        }
                    }
                }
            }
        }
    }

    @MainActor
    func login(email: String, password: String, invoke: @escaping @Sendable @MainActor (LoginResponse) -> Void) {
        if let msg = validateUserInput(email: email, password: password) {
            withAnimation {
                self.state = self.state.copy(toast: .set(Toast(style: .error, message: msg)))
            }
        } else {
            withAnimation {
                self.state = self.state.copy(isLoading: .set(true))
            }
            tasker.back {
                await self.project.auth.login(body: LoginRequest(email: email, password: password)) { res in
                    self.mainSync {
                        invoke(res)
                    }
                } failed: { msg in
                    self.mainSync {
                        withAnimation {
                            self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: msg)))
                        }
                    }
                }
            }
        }
    }
    
    private func validateUserInput(name: String, email: String, phone: String, password: String) -> String? {
        // 1️⃣ Name validation
        if name.trimmingCharacters(in: .whitespaces).isEmpty {
            return "Name cannot be empty."
        }
        
        // 2️⃣ Email validation using regex
        let emailPattern = #"^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        if !NSPredicate(format: "SELF MATCHES %@", emailPattern).evaluate(with: email) {
            return "Please enter a valid email address."
        }
        
        // 3️⃣ Phone validation (digits only, length 8–15)
        let phoneDigits = phone.filter { $0.isNumber }
        if phoneDigits.count < 8 || phoneDigits.count > 15 {
            return "Please enter a valid phone number."
        }
        
        // 4️⃣ Password validation (8+ chars, 1 uppercase, 1 digit, 1 special char)
        if let passwordError = validatePassword(password) {
            return passwordError
        }
        
        // ✅ All validations passed
        return nil
    }
    
    
    private func validateUserInput(email: String, password: String) -> String? {
        // 1️⃣ Email validation using regex
        let emailPattern = #"^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        if !NSPredicate(format: "SELF MATCHES %@", emailPattern).evaluate(with: email) {
            return "Please enter a valid email address."
        }
        // 2️⃣ Password validation (8+ chars, 1 uppercase, 1 digit, 1 special char)
        if let passwordError = validatePassword(password) {
            return passwordError
        }
        
        // ✅ All validations passed
        return nil
    }

    private func validatePassword(_ password: String) -> String? {
        var missingRules: [String] = []
        
        // Length check
        if password.count < 8 {
            missingRules.append("at least 8 characters")
        }
        
        // Uppercase letter check
        if password.range(of: "[A-Z]", options: .regularExpression) == nil {
            missingRules.append("one uppercase letter")
        }
        
        // Number check
        if password.range(of: "\\d", options: .regularExpression) == nil {
            missingRules.append("one number")
        }
        
        // Special character check
        if password.range(of: "[!@#$%^&*]", options: .regularExpression) == nil {
            missingRules.append("one special character (!@#$%^&*)")
        }
        
        // ✅ All good
        if missingRules.isEmpty {
            return nil
        }
        
        // ❌ Return dynamic message
        let joined = missingRules.joined(separator: ", ")
        return "Password must contain \(joined)."
    }

    @SturdyCopy
    struct BaseAppObserveState {
        
        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
    }
}
