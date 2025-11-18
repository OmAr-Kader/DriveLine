//
//  SessionView.swift
//  DriveLine
//
//  Created by OmAr Kader on 11/11/2025.
//


import SwiftUI
import SwiftUISturdy

@MainActor
struct SessionView: View {
    
    let navigator: Navigator

    @Binding var app: BaseAppObserve
    @Binding var obs: HomeObserve

    var body: some View {
        ZStack {
            List(obs.state.aiSessions) { session in
                AiSessionRow(session: session).onTapGesture {
                    navigator.navigateTo(screen: session)
                }.swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button {
                        obs.deleteSession(userBase: app.state.userBase, sessionId: session.idCloud)
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }.tint(.red.opacity(0.8))
                }
            }
            LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.state.isLoading)
        }.onAppear {
            guard let new = app.state.forUpdateSessions else { return }
            if let newSession = new.newSession {
                obs.onAiSessionsCreated(newSession)
            } else {
                obs.fetchAiSessions(app.state.userBase)
            }
            app.setForUpdateSessions(nil)
        }
    }
}

struct AiSessionRow: View {
    let session: AiSessionData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(session.title)
                .foregroundChangeColor(.textOfApp)
                .font(.headline)
            Text(session.lastMessage)
                .font(.subheadline)
                .foregroundChangeColor(.textHint)
            Text(session.updatedAt.formatted(date: .abbreviated, time: .shortened))
                .font(.caption)
                .foregroundChangeColor(.textGray)
        }
        .padding(.vertical, 4)
    }
}

struct AiSessionDetailView: View {
    let session: AiSessionData
    
    var body: some View {
        VStack(spacing: 16) {
            Text(session.title)
                .foregroundChangeColor(.textOfApp)
                .font(.largeTitle)
                .bold()
            
            Text("Last message:")
                .foregroundChangeColor(.textOfApp)
                .font(.headline)
            Text(session.lastMessage)
                .foregroundChangeColor(.textOfApp)
                .font(.body)
            
            Spacer()
        }
        .padding()
        .navigationTitle("Session Detail")
    }
}
