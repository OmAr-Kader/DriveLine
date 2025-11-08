//
//  AuthRepo.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import Foundation
import SwiftUISturdy

protocol AuthRepo :Sendable {
 
    @BackgroundActor
    func register(body: RegisterRequest, invoke: @escaping @BackgroundActor (BaseResponse) async -> Void, failed: @BackgroundActor (String) -> Void) async
    
    @BackgroundActor
    func login(body: LoginRequest, invoke: @escaping @BackgroundActor (LoginResponse) -> Void, failed: @BackgroundActor (String) -> Void) async
    
    @BackgroundActor
    func fetchUserById(user: UserBase, invoke: @escaping @BackgroundActor (User) -> Void, failed: @BackgroundActor (String) -> Void) async
    
    @BackgroundActor
    func updateUserById(token: String, user: User, invoke: @escaping @BackgroundActor (BaseResponse) -> Void, failed: @BackgroundActor (String) -> Void) async
}
