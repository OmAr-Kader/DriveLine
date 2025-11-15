//
//  ChatScreen.swift
//  SwiftUITemplate
//
//  Created by OmAr Kader on 05/11/2025.
//

import SwiftUI
import SwiftUISturdy

@MainActor
struct ChatScreen: View {
    
    @Binding
    private var app: BaseAppObserve
    
    @State
    private var obs: ChatObserve = ChatObserve()
    
    private let currentSessionId: String?
    
    @State
    private var speech: SpeechManagerObservation = SpeechManagerObservation()
    
    @FocusState private var inputFocused: Bool
    @State private var scrollProxy: ScrollViewProxy? = nil

    init(app: Binding<BaseAppObserve>, currentSessionId: String? = nil) {
        self._app = app
        self.currentSessionId = currentSessionId
    }
    
    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    List(obs.state.messages) { msg in
                        MessageRow(message: msg)
                            .listRowSeparator(.hidden)
                            .id(msg.id)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button {
                                    LogKit.print(obs.state.isSending)
                                    LogKit.print(obs.state.currentSessionId)
                                    guard !obs.state.isSending, let sessionId = obs.state.currentSessionId else { return }
                                    obs.removeMsgAndGetQuestion(app.state.userBase, msg) { question in
                                        obs.send(app.state.userBase, text: question, sessionId: sessionId) {
                                            app.setForUpdateSessions((newSession: nil, needUpdateOnly: true))
                                        }
                                    }
                                } label: {
                                    Label("Regenrate", systemImage: "repeat")
                                }.tint(.blue.opacity(0.8))
                                Button {
                                    UIPasteboard.general.string = msg.text
                                } label: {
                                    Label("Copy", systemImage: "document.on.document")
                                }.tint(.green.opacity(0.8))
                            }
                    }.listStyle(PlainListStyle())
                        .listRowSeparator(.hidden)
                        .scrollContentBackground(.hidden)
                        .background(Color.clear)
                        .padding(.bottom, 8)
                        .onAppear {
                            self.scrollProxy = proxy
                        }
                }
                Divider()
            }.safeAreaInset(edge: .bottom, content: inputBar)
            LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.state.isLoading)
        }
        .onChange(obs.state.messages) { new in
            guard let last = new.last else { return }
            // scroll to bottom when messages change
            scrollToBottom(last.id , animated: true)
            if !last.isUser {
                speech.speak(last.text)
            }
        }
        .onAppeared {
            if let currentSessionId, let userBase = app.state.userBase {
                obs.fetchMessages(userBase, sessionId: currentSessionId) { lastId in
                    TaskBackSwitcher {
                        await Task.sleep(seconds: 0.3)
                        TaskMainSwitcher {
                            scrollToBottom(lastId, animated: false)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder func inputBar() -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .bottom, spacing: 4) {
                TextField(String("How i can i help you?"), text: Binding(get: { speech.transcribedText }, set: { speech.transcribedText = $0 }), axis: .vertical)
                    .lineLimit(6)
                    .focused($inputFocused)
                    .padding(EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8))
                    .scrollContentBackground(.hidden) // remove default background (iOS16+)
                    .foregroundColor(.primary)        // text color (may be enough)
                    .tint(.accentColor)               // caret and selection color
                    .font(.body)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.4)))
                    .disabled(obs.state.isSending || obs.state.isLoading)
                    .onSubmit(self.onSubmit)
                Spacer().width(6)
                Button {
                    Task {
                        await handleMainButtonTap()
                    }
                } label: {
                    Group {
                        if obs.state.isSending {
                            ProgressView()
                                .progressViewStyle(.circular)
                        } else {
                            let buttonImage = buttonImage
                            Image(systemName: buttonImage)
                                .foregroundColor(.white)
                        }
                    }
                    .frame(width: 44, height: 44)
                    .background(buttonBackgroundColor)
                    .clipShape(Circle())
                    .shadow(radius: 2)
                }
                .disabled(obs.state.isSending || obs.state.isLoading)
                .animation(.easeInOut(duration: 0.2), value: obs.state.isSending)
                .accessibilityLabel(buttonAccessibilityLabel)
            }
        }.padding(.horizontal)
            .padding(.vertical, 8)
            .background(.regularMaterial)
            .visibleToolbar()
            .onChange(inputFocused) { inputFocused in
                if inputFocused, speech.isListening {
                    speech.stopListening()
                }
            }.onChange(speech.isAuthorized) { new in
                if new {
                    Task {
                        await handleMainButtonTap()
                    }
                }
            }
    }
    
    private func onSubmit() {
        guard !speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        sendToGemini()
    }
    
    private func sendToGemini() {
        if let sessionId = obs.state.currentSessionId {
            obs.send(app.state.userBase, text: speech.transcribedText, sessionId: sessionId) {
                app.setForUpdateSessions((newSession: nil, needUpdateOnly: true))
                speech.transcribedText = ""
            }
        } else {
            obs.send(app.state.userBase, text: speech.transcribedText) { new in
                app.setForUpdateSessions((newSession: new, needUpdateOnly: true))
                speech.transcribedText = ""
            }
        }
    }
    
    private var buttonImage: String {
        if speech.isListening {
            return "stop.fill"
        } else {
            let text = speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines)
            if !text.isEmpty {
                return "paperplane.fill"
            } else {
                return "waveform"
            }
        }
    }
    
    private var buttonAccessibilityLabel: String {
        if obs.state.isSending {
            return "Sending message"
        } else if !speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !speech.isListening {
            return "Send message"
        } else {
            return speech.isListening ? "Stop recording" : "Start recording"
        }
    }
    
    private var buttonBackgroundColor: Color {
        if obs.state.isSending {
            return .gray.opacity(0.3)
        } else if !speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !speech.isListening {
            return .blue
        } else {
            return speech.isListening ? .red : .green
        }
    }

    
    private func handleMainButtonTap() async {
        if !speech.isAuthorized {
            speech.requestSpeechRecognitionPermission()
            return
        }
        TaskMainSwitcher { [self] in
            withAnimation {
                inputFocused = false
            }
            if speech.isSpeaking {
                speech.stopSpeaking()
            }
        }
        if speech.isListening {
            speech.stopListening()
        } else {
            let tirmmed = speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !tirmmed.isEmpty else { speech.startListening(); return }
            sendToGemini()
        }
    }
    
    
    private func scrollToBottom(_ id: String?, animated: Bool) {
        guard let proxy = scrollProxy, let id else { return }
        DispatchQueue.main.async {
            withAnimation(animated ? .easeOut : nil) {
                proxy.scrollTo(id)
                //proxy.scrollTo("bottom", anchor: .bottom)
            }
        }
    }
}

@MainActor
struct MessageRow: View {
    let message: AiMessageData

    var body: some View {
        HStack {
            if !message.isUser { Spacer() } // bot messages on right? change below for your preference

            VStack(alignment: .leading, spacing: 6) {
                Text(.init(message.text))
                    .font(.body)
                    .multilineTextAlignment(.leading)
                    .padding(10)
                    .background(bubbleBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .foregroundColor(bubbleTextColor)

                Text(formattedDate)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.leading, 6)
            }
            .frame(maxWidth: 520, alignment: message.isUser ? .trailing : .leading) // limit width

            if message.isUser { Spacer() } // user messages on left? adjust to taste
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }

    private var bubbleBackground: Color {
        message.isUser ? Color.blue.opacity(0.8) : Color(.secondarySystemBackground)
    }

    private var bubbleTextColor: Color {
        message.isUser ? .white : .primary
    }

    private var formattedDate: String {
        let fmt = DateFormatter()
        fmt.timeStyle = .short
        return fmt.string(from: message.createdAt)
    }
}
