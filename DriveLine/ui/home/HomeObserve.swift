//
//  ChatViewModel.swift
//  DriveLine
//
//  Created by OmAr Kader on 06/11/2025.
//

import Foundation
import SwiftUISturdy
import SwiftUI

@MainActor
@Observable
final class HomeObserve : BaseObserver {
    
    @MainActor
    private(set) var state: HomeObserveState = HomeObserveState()

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
    
    var isEditSheet: Binding<Bool> {
        Binding {
            self.state.isEditSheet
        } set: {
            self.sheet(isEditSheet: $0)
        }
    }
    
    @MainActor
    func send(text: String, resetText: @escaping @Sendable @MainActor () -> Void) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !self.state.isSending else { return }

        let userMessage = Message(text: trimmed, sender: .user)
        withAnimation {
            self.state = self.state.copy(messages: .set(self.state.messages.add(userMessage)), lastError: .set(nil), isSending: .set(true))
            resetText()
        }
        self.tasker.back {
            do {
                let response = try await self.generateContent(prompt: trimmed)
                self.mainSync { [self] in
                    withAnimation {
                        let botMessage = Message(text: response, sender: .bot)
                        self.state = self.state.copy(messages: .set(self.state.messages.add(botMessage)), isSending: .set(false))
                    }
                }
            } catch {
                self.mainSync { [self] in
                    withAnimation {
                        let errText = "Error: \(error.localizedDescription)"
                        self.state = self.state.copy(messages: .set(self.state.messages.add(Message(text: errText, sender: .bot))), lastError: .set(errText), isSending: .set(true))
                    }
                }
            }
        }
    }

    @MainActor
    func addLocalMessage(text: String, sender: Sender = .bot) {
        self.state = self.state.copy(messages: .set(self.state.messages.add(Message(text: text, sender: sender))))
    }
    
    @MainActor
    func addWelcomeMessage() {
        self.state = self.state.copy(messages: .set(self.state.messages.add(Message(text: "Hi — ask me anything about AI or prompt the model.", sender: .bot))))
    }
    
    @BackgroundActor
    private func generateContent(prompt: String) async throws -> String {
        guard !prompt.isEmpty else { return "" }

        let urlString = "\(Const.GEMINI_URL)/\(Const.GEMINI_MODEL):generateContent?key=\(SecureConst.GEMINI_API_KEY)"
        guard let url = URL(string: urlString) else {
            throw GeminiError.invalidURL
        }

        let payload = GeminiRequest(contents: [
            .init(parts: [.init(text: prompt)])
        ])
        do {
            let geminiResponse: GeminiResponse = try await url.createPOSTRequest(body: payload).performRequest()
            
            if let text = geminiResponse.candidates?.first?.content.parts.first?.text {
                return text.trimmingCharacters(in: .whitespacesAndNewlines)
            } else {
                throw GeminiError.noContent
            }

        } catch {
            throw GeminiError.invalidResponse
        }
    }
    
    @MainActor
    func fetchUser(_ userBase: UserBase?) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.auth.fetchUserById(user: userBase) { user in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), user: .set(user))
                    }
                }
            } failed: { _ in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }
        }
    }
    
    
    @MainActor
    func updateUser(userBase: UserBase?, userEdit: UserEdit, invoke: @escaping @Sendable @MainActor (User) -> Void) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            let user = User(userBase: userBase, userEdit: userEdit)
            await self.project.auth.updateUserById(token: userBase.token, user: user) { base in
                self.mainSync {
                    invoke(user)
                }
            } failed: { _ in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }

        }
    }
    
    @MainActor
    func offLoading(user: User) {
        withAnimation {
            self.state = self.state.copy(isLoading: .set(false), user: .set(user), isEditSheet: .set(false))
        }
    }
    
    @MainActor
    func sheet(isEditSheet: Bool) {
        withAnimation {
            self.state = self.state.copy(isEditSheet: .set(isEditSheet))
        }
    }
    
    struct HomeObserveState {

        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
        
        private(set) var messages: [Message] = []
        private(set) var lastError: String?
        private(set) var isSending: Bool = false

        private(set) var user: User? = nil
        private(set) var isEditSheet: Bool = false
        
        @MainActor
        mutating func copy(
            isLoading: Update<Bool> = .keep,
            toast: Update<Toast?> = .keep,
            messages: Update<[Message]> = .keep,
            lastError: Update<String?> = .keep,
            isSending: Update<Bool> = .keep,
            user: Update<User?> = .keep,
            isEditSheet: Update<Bool> = .keep
        ) -> Self {
            if case .set(let value) = isLoading { self.isLoading = value }
            if case .set(let value) = toast { self.toast = value }
            if case .set(let value) = messages { self.messages = value }
            if case .set(let value) = lastError { self.lastError = value }
            if case .set(let value) = isSending { self.isSending = value }
            if case .set(let value) = user { self.user = value }
            if case .set(let value) = isEditSheet { self.isEditSheet = value }
            return self
        }
    }
}
