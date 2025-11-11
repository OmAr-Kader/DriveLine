//
//  AuthBase.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy

final class AuthBase {
    
    private let repo: AuthRepo
    
    init(repo: AuthRepo) {
        self.repo = repo
    }
    
    @BackgroundActor
    func register(body: RegisterRequest, invoke: @escaping @BackgroundActor (BaseMessageResponse) async -> Void, failed: @BackgroundActor (String) -> Void) async {
        await repo.register(body: body, invoke: invoke, failed: failed)
    }
    
    
    @BackgroundActor
    func login(body: LoginRequest, invoke: @escaping @BackgroundActor (LoginResponse) -> Void, failed: @BackgroundActor (String) -> Void) async {
        await repo.login(body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func fetchUserById(user: UserBase, invoke: @escaping @BackgroundActor (User) -> Void, failed: @BackgroundActor (String) -> Void) async {
        await repo.fetchUserById(user: user, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func updateUserById(token: String, user: User, invoke: @escaping @BackgroundActor (BaseMessageResponse) -> Void, failed: @BackgroundActor (String) -> Void) async {
        await repo.updateUserById(token: token, user: user, invoke: invoke, failed: failed)
    }
    
}
