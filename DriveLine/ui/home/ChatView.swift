//
//  Test.swift
//  SwiftUITemplate
//
//  Created by OmAr Kader on 05/11/2025.
//

import SwiftUI
import SwiftUISturdy

@MainActor
struct ChatView: View {

    private let vm: ChatViewModel
    private var speech: SpeechManagerObservation = SpeechManagerObservation()
    @FocusState private var inputFocused: Bool
    @State private var scrollProxy: ScrollViewProxy? = nil

    init(vm: ChatViewModel) {
        self.vm = vm
    }
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
            
            messagesView
            
            Divider()
            
        }
        .safeAreaInset(edge: .bottom, content: inputBar)
        .onChange(vm.messages) { _ in
                // scroll to bottom when messages change
                scrollToBottom(animated: true)
                if let last = vm.messages.last, last.sender == .bot {
                    // MARK: speech.speak(last.text)
                }
            }
            .onAppear {
                scrollToBottom(animated: false)
            }
    }


    private var messagesView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(vm.messages) { msg in
                        MessageRow(message: msg)
                            .id(msg.id)
                    }

                    // bottom spacer to ensure last message has some padding
                    Rectangle()
                        .foregroundColor(.clear)
                        .frame(height: 8)
                        .id("bottom")
                }
                .padding(.vertical, 8)
            }
            .onAppear {
                self.scrollProxy = proxy
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
                    .disabled(vm.isSending)
                    .onSubmit {
                        Task {
                            await vm.send(text: speech.transcribedText) {
                                speech.transcribedText = ""
                            }
                        }
                    }
                Spacer().width(6)
                Button {
                    Task {
                        await handleMainButtonTap()
                    }
                } label: {
                    Group {
                        if vm.isSending {
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
                .disabled(vm.isSending)
                .animation(.easeInOut(duration: 0.2), value: vm.isSending)
                .accessibilityLabel(buttonAccessibilityLabel)
            }
        }.padding(.horizontal)
            .padding(.vertical, 8)
            .background(.regularMaterial)
            .onAppeared {
                speech.requestSpeechRecognitionPermission()
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
                return "mic.fill"
            }
        }
    }
    
    private var buttonAccessibilityLabel: String {
        if vm.isSending {
            return "Sending message"
        } else if !speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !speech.isListening {
            return "Send message"
        } else {
            return speech.isListening ? "Stop recording" : "Start recording"
        }
    }
    
    private var buttonBackgroundColor: Color {
        if vm.isSending {
            return .gray.opacity(0.3)
        } else if !speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !speech.isListening {
            return .blue
        } else {
            return speech.isListening ? .red : .green
        }
    }

    
    private func handleMainButtonTap() async {
        TaskMainSwitcher(priority: .userInitiated) { [self] in
            withAnimation {
                inputFocused = false
            }
            if speech.isSpeaking {
                // MARK: speech.stopSpeaking()
            }
        }
        if speech.isListening {
            speech.stopListening()
        } else {
            let text = speech.transcribedText.trimmingCharacters(in: .whitespacesAndNewlines)
            if !text.isEmpty {
                await vm.send(text: text) {
                    speech.transcribedText = ""
                }
                //inputFocused = true
            } else {
                speech.startListening()
            }
        }
    }
    
    
    private func scrollToBottom(animated: Bool) {
        guard let proxy = scrollProxy else { return }
        DispatchQueue.main.async {
            withAnimation(animated ? .easeOut : nil) {
                proxy.scrollTo("bottom", anchor: .bottom)
            }
        }
    }
}

@MainActor
struct MessageRow: View {
    let message: Message

    var body: some View {
        HStack {
            if message.sender == .bot { Spacer() } // bot messages on right? change below for your preference

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
            .frame(maxWidth: 520, alignment: message.sender == .user ? .trailing : .leading) // limit width

            if message.sender == .user { Spacer() } // user messages on left? adjust to taste
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
    }

    private var bubbleBackground: Color {
        message.sender == .user ? Color("UserBubble", default: Color.blue.opacity(0.8)) : Color("BotBubble", default: Color(.secondarySystemBackground))
    }

    private var bubbleTextColor: Color {
        message.sender == .user ? .white : .primary
    }

    private var formattedDate: String {
        let fmt = DateFormatter()
        fmt.timeStyle = .short
        return fmt.string(from: message.createdAt)
    }
}

extension Color {
    init(_ name: String, default defaultColor: Color) {
        if let _ = UIColor(named: name) {
            self = Color(name)
        } else {
            self = defaultColor
        }
    }
}
