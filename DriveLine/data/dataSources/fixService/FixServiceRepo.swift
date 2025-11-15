//
//  FixServiceRepo.swift
//  DriveLine
//
//  Created by OmAr Kader on 14/11/2025.
//

import Foundation
import SwiftUISturdy

internal protocol FixServiceRepo : Sendable {
            
    @BackgroundActor
    func createService(userBase: UserBase, body: ProvideServiceRequest, invoke: @escaping @BackgroundActor (ProvideServiceRequest) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func updateService(userBase: UserBase, serviceProvidId: String, body: UpdateProvidedServiceRequest, invoke: @escaping @BackgroundActor (ProvideServiceRequest) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func getServiceById(userBase: UserBase, serviceProvidId: String, invoke: @escaping (GetAServiceRespond) -> Void, failed: @escaping (String) -> Void) async
    
    @BackgroundActor
    func getServicesByServiceAdminId(userBase: UserBase, serviceAdminId: Int, invoke: @escaping ([GetAServiceRespond]) -> Void, failed: @escaping (String) -> Void) async
        
    @BackgroundActor
    func getServicesByTech(userBase: UserBase, techId: String, invoke: @escaping ([ProvideServiceRequest]) -> Void, failed: @escaping (String) -> Void) async
}
