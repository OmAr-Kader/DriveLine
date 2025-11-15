//
//  FixServiceBase.swift
//  DriveLine
//
//  Created by OmAr Kader on 14/11/2025.
//


import Foundation
import SwiftUISturdy


import Foundation
import SwiftUISturdy

final class FixServiceBase {
    
    private let repo: FixServiceRepo
    
    init(repo: FixServiceRepo) {
        self.repo = repo
    }
    
    @BackgroundActor
    func createService(userBase: UserBase, body: ProvideServiceRequest, invoke: @escaping @BackgroundActor (ProvideServiceRequest) -> Void, failed: @escaping (String) -> Void) async {
        await repo.createService(userBase: userBase, body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func updateService(userBase: UserBase, serviceProvidId: String, body: UpdateProvidedServiceRequest, invoke: @escaping @BackgroundActor (ProvideServiceRequest) -> Void, failed: @escaping (String) -> Void) async {
        await repo.updateService(userBase: userBase, serviceProvidId: serviceProvidId, body: body, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func getServiceById(userBase: UserBase, serviceProvidId: String, invoke: @escaping (GetAServiceRespond) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getServiceById(userBase: userBase, serviceProvidId: serviceProvidId, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func getServicesByServiceAdminId(userBase: UserBase, serviceAdminId: Int, invoke: @escaping ([GetAServiceRespond]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getServicesByServiceAdminId(userBase: userBase, serviceAdminId: serviceAdminId, invoke: invoke, failed: failed)
    }
    
    @BackgroundActor
    func getServicesByTech(userBase: UserBase, techId: String, invoke: @escaping ([ProvideServiceRequest]) -> Void, failed: @escaping (String) -> Void) async {
        await repo.getServicesByTech(userBase: userBase, techId: techId, invoke: invoke, failed: failed)
    }
}
