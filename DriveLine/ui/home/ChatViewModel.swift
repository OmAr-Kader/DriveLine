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
final class ChatViewModel {
    private(set) var messages: [Message] = []
    //@Published var inputText: String = ""
    var isSending: Bool = false
    var lastError: String?
    
    private let GEMINI_API_KEY: String = ""

    init() {

        // Seed example message(s)
        self.messages = [
            Message(text: "Hi — ask me anything about AI or prompt the model.", sender: .bot)
        ]
    }


    @MainActor
    func send(text: String, resetText: @escaping @Sendable @MainActor () -> Void) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSending else { return }

        // Append user message optimistically
        let userMessage = Message(text: trimmed, sender: .user)
        withAnimation {
            messages.append(userMessage)
            resetText()
            lastError = nil
            isSending = true
        }
        TaskBackSwitcher {
            do {
                let response = try await self.generateContent(prompt: trimmed)
                TaskMainSwitcher { [self] in
                    withAnimation {
                        let botMessage = Message(text: response, sender: .bot)
                        messages.append(botMessage)
                        isSending = false
                    }
                }
            } catch {
                TaskMainSwitcher { [self] in
                    withAnimation {
                        let errText = "Error: \(error.localizedDescription)"
                        messages.append(Message(text: errText, sender: .bot))
                        lastError = errText
                        isSending = false
                    }
                }
            }
        }

    }

    // Optional helper: add local message (system or debug)
    @MainActor
    func addLocalMessage(text: String, sender: Sender = .bot) {
        messages.append(Message(text: text, sender: sender))
    }
    
    @BackgroundActor
    func generateContent(prompt: String) async throws -> String {
        guard !prompt.isEmpty else { return "" }

        let urlString = "\(Const.GEMINI_URL)/\(Const.GEMINI_MODEL):generateContent?key=\(GEMINI_API_KEY)"
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
}
