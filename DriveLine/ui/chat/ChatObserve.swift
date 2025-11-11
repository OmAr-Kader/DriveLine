//
//  ChatObserve.swift
//  DriveLine
//
//  Created by OmAr Kader on 11/11/2025.
//


import Foundation
import SwiftUISturdy
import SwiftUI

@MainActor
@Observable
final class ChatObserve : BaseObserver {
    
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
    
    @MainActor
    func fetchMessages(_ userBase: UserBase, sessionId: String, invoke: @escaping @Sendable @BackgroundActor () -> Void) {
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.aiChat.getSessionMessages(userBase, sessionId: sessionId) { new in
                invoke()
                self.mainSync {
                    let newList = new.map({ AiMessageData($0) })
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), currentSessionId: .set(sessionId), messages: .set(newList))
                    }
                }
            } failed: { _ in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(.init(style: .error, message: "Failed To Load Messages, you can continue as new session")), lastError: .set("Failed"))
                    }
                }
            }

        }
    }
    
    @MainActor
    func send(_ userBase: UserBase?, text: String, resetText: @escaping @Sendable @MainActor (AiSessionData) -> Void) {
        guard !self.state.isSending, let userBase else { return }
        self.state = self.state.copy(isSending: .set(true))
        self.tasker.back {
            await self.project.aiChat.createSessionWithMessage(userBase, body: .init(title: Date.now.toStringDMYFormat() + " - " + Date.now.toStringHMFormat(), text: text, isUser: true)) { res in
                self.updateSessionCreation(res, resetText)
                TaskBackSwitcher(block: self.sendToGeminiAndUploadRespond(userBase, sessionId: res.session.id, text: res.message.text))
            } failed: { msg in
                self.mainSync { [self] in
                    withAnimation {
                        self.state = self.state.copy(toast: .set(.init(style: .error, message: "Failed")), lastError: .set("Failed"), isSending: .set(true))
                    }
                }
            }
        }
    }
    
    @BackgroundActor
    private func updateSessionCreation(_ res: CreateSessionResponse,_ resetText: @escaping @Sendable @MainActor (AiSessionData) -> Void) {
        self.mainSync {
            let currentSession = AiSessionData(res.session)
            let userMessage = AiMessageData(res.message)
            let newList = [userMessage]
            withAnimation {
                self.state = self.state.copy(currentSessionId: .set(currentSession.id), messages: .set(newList), lastError: .set(nil))
                resetText(currentSession)
            }
        }
    }
    
    
    @MainActor
    func send(_ userBase: UserBase?,text: String, sessionId: String, resetText: @escaping @Sendable @MainActor () -> Void) {
        guard !self.state.isSending, let userBase else { return }
        let userMessage = addToLocalList(text: text, resetText: resetText)
        
        self.tasker.back {
            let taskGemini = self.sendToGeminiAndUploadRespond(userBase, sessionId: sessionId, text: text)
            let taskCloudUser = self.uploadUserQuestion(userBase, sessionId: sessionId, userMessage: userMessage)
            await self.tasker.concurrent(
                [taskGemini, taskCloudUser]
            )
        }
    }
    
    @MainActor
    private func addToLocalList(text: String, resetText: @escaping @Sendable @MainActor () -> Void) -> AiMessageData {
        let userMessage = AiMessageData(text: text, isUser: true)
        self.tasker.mainSync {
            let newList = self.state.messages.add(userMessage)
            withAnimation {
                self.state = self.state.copy(messages: .set(newList), lastError: .set(nil), isSending: .set(true))
                resetText()
            }
        }
        return userMessage
    }
    
    @BackgroundActor
    private func sendToGeminiAndUploadRespond(_ userBase: UserBase, sessionId: String, text: String) -> @Sendable @BackgroundActor () async -> Void {
        return {
            do {
                let response = try await self.generateContent(prompt: text)
                let dataBotMessage = Date.now
                self.mainSync { [self] in
                    let botMessage = AiMessageData(text: response, isUser: false, createdAt: dataBotMessage)
                    let newList = self.state.messages.add(botMessage)
                    withAnimation {
                        self.state = self.state.copy(messages: .set(newList), isSending: .set(false))
                    }
                }
                await self.project.aiChat.addMessage(userBase, body: .init(sessionId: sessionId, text: response, isUser: false)) { msg in
                    
                } failed: { _ in
                    self.mainSync { [self] in
                        let newList =  self.state.messages.editItem(where: { dataBotMessage == $0.createdAt }, edit: { $0.isFailedToUpload = true })
                        withAnimation {
                            self.state = self.state.copy(messages: .set(newList))
                        }
                    }
                }
            } catch {
                let errText = "Error: \(error.localizedDescription)"
                self.mainSync { [self] in
                    let failedMsg = AiMessageData(text: errText, isUser: false)
                    let newList = self.state.messages.add(failedMsg)
                    withAnimation {
                        self.state = self.state.copy(messages: .set(newList), lastError: .set(errText), isSending: .set(true))
                    }
                }
            }
        }
    }
    
    @BackgroundActor
    private func uploadUserQuestion(_ userBase: UserBase, sessionId: String, userMessage: AiMessageData) -> @Sendable @BackgroundActor () async -> Void {
        return {
            await self.project.aiChat.addMessage(userBase, body: .init(sessionId: sessionId, text: userMessage.text, isUser: true)) { msg in
                
            } failed: { _ in
                self.mainSync { [self] in
                    let newList =  self.state.messages.editItem(where: { userMessage.createdAt == $0.createdAt }, edit: { $0.isFailedToUpload = true })
                    withAnimation {
                        self.state = self.state.copy(messages: .set(newList))
                    }
                }
            }
        }
    }
    
    /*@MainActor
    func addLocalMessage(text: String, isUser: Bool = false) {
        self.state = self.state.copy(messages: .set(self.state.messages.add(AiMessage(sessionId: "", text: text, isUser: isUser))))
    }
    
    @MainActor
    func addWelcomeMessage() {
        self.state = self.state.copy(messages: .set(self.state.messages.add(AiMessage(sessionId: "", text: "Hi — ask me anything about AI or prompt the model.", isUser: false))))
    }*/
    
    
    @MainActor
    func setCurrentSessionId(_ currentSessionId: String) {
        self.state = self.state.copy(currentSessionId: .set(currentSessionId))
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
    
    struct HomeObserveState {

        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
        
        private(set) var currentSessionId: String?
        private(set) var messages: [AiMessageData] = []
        private(set) var lastError: String?
        private(set) var isSending: Bool = false
        
        @MainActor
        mutating func copy(
            isLoading: Update<Bool> = .keep,
            toast: Update<Toast?> = .keep,
            currentSessionId: Update<String?> = .keep,
            messages: Update<[AiMessageData]> = .keep,
            lastError: Update<String?> = .keep,
            isSending: Update<Bool> = .keep,
        ) -> Self {
            if case .set(let value) = isLoading { self.isLoading = value }
            if case .set(let value) = toast { self.toast = value }
            
            if case .set(let value) = currentSessionId { self.currentSessionId = value }
            if case .set(let value) = messages { self.messages = value }
            if case .set(let value) = lastError { self.lastError = value }
            if case .set(let value) = isSending { self.isSending = value }

            return self
        }
    }
}
