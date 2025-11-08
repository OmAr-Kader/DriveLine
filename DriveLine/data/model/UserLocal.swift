//
//  UserLocal.swift
//  IOS-SwiftUI-Template
//
//  Created by OmAr on 05/09/2024.
//

struct UserBase : Equatable {
    let id: String
    let name: String
    let email: String
    let accountType: String
    let token: String

    var isMechanic: Bool {
        accountType == Const.USER_TYPE_MECHANIC
    }
}
