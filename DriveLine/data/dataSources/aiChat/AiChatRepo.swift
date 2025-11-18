//
//  AiChatRepo.swift
//  DriveLine
//
//  Created by OmAr Kader on 11/11/2025.
//

import SwiftUISturdy
import Combine
import CouchbaseLiteSwift

internal protocol AiChatRepo : Sendable {
            
    @BackgroundActor
    func createSessionWithMessage(userBase: UserBase, body: CreateSessionRequest, invoke: @escaping @BackgroundActor (CreateSessionResponse) async -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    @inlinable func addMessage(userBase: UserBase, body: CreateMessageRequest, invoke: @escaping (AiMessage) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    @inlinable func pushMessageToGemini(userBase: UserBase, body: PushMessageRequest, invoke: @escaping (AiMessage) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func getSessions(userBase: UserBase, invoke: @escaping ([AiSession]) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func getSessionMessages(userBase: UserBase, sessionId: String, invoke: @escaping ([AiMessage]) -> Void, failed: @escaping (String) -> Void) async
        
    @BackgroundActor
    func deleteMessage(userBase: UserBase, id: String, invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func deleteMessage(userBase: UserBase, id: [String], invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func deleteSession(userBase: UserBase, id: String, invoke: @escaping (BaseSuccessResponse) -> Void, failed: @escaping (String) -> Void) async
}
