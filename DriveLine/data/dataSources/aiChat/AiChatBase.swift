//
//  AiChatBase.swift
//  DriveLine
//
//  Created by OmAr Kader on 11/11/2025.
//

import Foundation
import SwiftUISturdy

final class AiChatBase {

    private let repo: AiChatRepo
    
    init(repo: AiChatRepo) {
        self.repo = repo
    }
    
    @BackgroundActor
    func createSessionWithMessage(_ userBase: UserBase, body: CreateSessionRequest, invoke: @escaping @BackgroundActor (CreateSessionResponse) -> Void, failed: @escaping (String) -> Void) async {
        await repo.createSessionWithMessage(userBase: userBase, body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    @inlinable func addMessage(_ userBase: UserBase, body: CreateMessageRequest, invoke: @escaping (AiMessage) -> Void, failed: @escaping (String) -> Void) async {
        await repo.addMessage(userBase: userBase, body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func getSessions(_ userBase: UserBase, invoke: @escaping ([AiSession]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getSessions(userBase: userBase, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func getSessionMessages(_ userBase: UserBase, sessionId: String, invoke: @escaping ([AiMessage]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getSessionMessages(userBase: userBase, sessionId: sessionId, invoke: invoke, failed: failed)
    }
        
    @BackgroundActor
    func deleteMessage(_ userBase: UserBase, id: String, invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async {
        await repo.deleteMessage(userBase: userBase, id: id, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func deleteSession(_ userBase: UserBase, id: String, invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async {
        await repo.deleteSession(userBase: userBase, id: id, invoke: invoke, failed: failed)
    }
    
}
