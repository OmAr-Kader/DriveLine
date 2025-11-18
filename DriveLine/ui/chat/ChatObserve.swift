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
    private(set) var state: ChatObserveState = ChatObserveState()

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
    func fetchMessages(_ userBase: UserBase, sessionId: String, invoke: @escaping @Sendable @BackgroundActor (String?) -> Void) {
        self.state = self.state.copy(isLoading: .set(true))
        self.tasker.back {
            await self.project.aiChat.getSessionMessages(userBase, sessionId: sessionId) { new in
                invoke(new.last?.id)
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
                await self.sendToGeminiAndUploadRespond(userBase, sessionId: res.session.id, text: res.message.text, saveQuestion: false)
            } failed: { msg in
                self.mainSync { [self] in
                    withAnimation {
                        self.state = self.state.copy(toast: .set(.init(style: .error, message: "Failed")), lastError: .set("Failed"), isSending: .set(true))
                    }
                }
            }
        }
    }
    
    @MainActor
    func send(_ userBase: UserBase?,text: String, sessionId: String, resetText: @escaping @Sendable @MainActor () -> Void) {
        guard !self.state.isSending, let userBase else { return }
        addToLocalList(text: text, resetText: resetText)
        
        self.tasker.back {
            await self.sendToGeminiAndUploadRespond(userBase, sessionId: sessionId, text: text, saveQuestion: true)
        }
    }
    
    @BackgroundActor
    private func updateSessionCreation(_ res: CreateSessionResponse,_ resetText: @escaping @Sendable @MainActor (AiSessionData) -> Void) {
        self.mainSync {
            let currentSession = AiSessionData(res.session)
            let userMessage = AiMessageData(res.message)
            let newList = [userMessage]
            withAnimation {
                self.state = self.state.copy(currentSessionId: .set(res.session.id), messages: .set(newList), lastError: .set(nil))
                resetText(currentSession)
            }
        }
    }
    
    @MainActor
    private func addToLocalList(text: String, resetText: @escaping @Sendable @MainActor () -> Void) {
        let userMessage = AiMessageData(text: text, isUser: true)
        self.tasker.mainSync {
            let newList = self.state.messages.add(userMessage)
            withAnimation {
                self.state = self.state.copy(messages: .set(newList), lastError: .set(nil), isSending: .set(true))
                resetText()
            }
        }
    }
    
    @BackgroundActor
    private func sendToGeminiAndUploadRespond(_ userBase: UserBase, sessionId: String, text: String, saveQuestion: Bool) async {
        await self.project.aiChat.pushMessageToGemini(userBase: userBase, body: PushMessageRequest(sessionId: sessionId, text: text, saveQuestion: saveQuestion)) { message in
            self.mainSync { [self] in
                let botMessage = AiMessageData(message)
                let newList = self.state.messages.add(botMessage)
                withAnimation {
                    self.state = self.state.copy(messages: .set(newList), isSending: .set(false))
                }
            }
        } failed: { msg in
            let errText = "Error: \(msg)"
            self.mainSync { [self] in
                let failedMsg = AiMessageData(text: errText, isUser: false)
                let newList = self.state.messages.add(failedMsg)
                withAnimation {
                    self.state = self.state.copy(messages: .set(newList), lastError: .set(errText), isSending: .set(false))
                }
            }
        }
    }
    
    @MainActor
    func removeMsgAndGetQuestion(_ userBase: UserBase?, _ msg: AiMessageData, invoke: @escaping @Sendable @MainActor (String) -> Void) {
        self.tasker.mainSync {
            if msg.isUser {
                guard let index = self.state.messages.firstIndex(where:  { $0.idCloud == msg.idCloud }), let answer = self.state.messages[safe: index + 1], !answer.isUser else {
                    invoke(msg.text); return
                }
                let ids = self.idsForDelete([msg.idCloud, answer.idCloud])
                let text = msg.text
                var messages = self.state.messages
                invoke(text)
                messages.removeAll(where: { $0.idCloud == answer.idCloud || $0.idCloud == msg.idCloud })
                withAnimation {
                    self.state = self.state.copy(messages: .set(messages))
                }
                self.deleteFromCloud(userBase, id: ids)
            } else {
                guard let index = self.state.messages.firstIndex(where:  { $0.idCloud == msg.idCloud }), let question = self.state.messages[safe: index - 1], question.isUser else {
                    return
                }
                let ids = self.idsForDelete([question.idCloud, msg.idCloud])

                var messages = self.state.messages
                messages.removeAll(where: { $0.idCloud == msg.idCloud })
                invoke(question.text)
                withAnimation {
                    self.state = self.state.copy(messages: .set(messages))
                }
                self.deleteFromCloud(userBase, id: ids)
            }
        }
    }
    
    private func idsForDelete(_ ids: [String]) -> [String] {
        var filterIds: [String] = ids
        filterIds.removeAll(where: { $0.contains(Const.AI_MESSAGE_LOCAL) })
        return filterIds
    }
    
    private func deleteFromCloud(_ userBase: UserBase?, id: [String]) {
        guard let userBase else { return }
        self.tasker.back {
            await self.project.aiChat.deleteMessage(userBase, id: id) {_ in 
                
            } failed: { _ in
                
            }
        }
    }
    
    @MainActor
    func setCurrentSessionId(_ currentSessionId: String) {
        self.state = self.state.copy(currentSessionId: .set(currentSessionId))
    }
     
    
    struct ChatObserveState {

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
