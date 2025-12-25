//
//  FixServiceRepoImp.swift
//  DriveLine
//
//  Created by OmAr Kader on 14/11/2025.
//

import Foundation
import SwiftUISturdy

final class FixServiceRepoImp : FixServiceRepo {
    
    let appSessions: AppURLSessions

    init(appSessions: AppURLSessions) {
        self.appSessions = appSessions
    }
    
    @BackgroundActor
    func createService(userBase: UserBase, body: ProvideServiceRequest, invoke: @escaping @BackgroundActor (ProvideServiceRequest) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.FIX_SERVICES) else {
            LogKit.print("createService Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ProvideServiceRequest = try await url.createPOSTRequest(body: body).addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func updateService(userBase: UserBase, serviceProvidId: String, body: UpdateProvidedServiceRequest, invoke: @escaping @BackgroundActor (ProvideServiceRequest) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.FIX_SERVICES + serviceProvidId) else {
            LogKit.print("updateService Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ProvideServiceRequest = try await url.createPATCHRequest(body: body).addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    @BackgroundActor
    func getServiceById(userBase: UserBase, serviceProvidId: String, invoke: @escaping (GetAServiceRespond) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.FIX_SERVICES + serviceProvidId) else {
            LogKit.print("getServiceById Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: GetAServiceRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
    
    @BackgroundActor
    func getServicesByServiceAdminId(userBase: UserBase, serviceAdminId: Int, invoke: @escaping ([GetAServiceRespond]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.servicesByServiceAdminId(serviceAdminId)) else {
            LogKit.print("getServicesByServiceAdminId Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: GetAServiceRootRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response.data)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
        
    @BackgroundActor
    func getServicesByTech(userBase: UserBase, techId: String, invoke: @escaping ([ProvideServiceRequest]) -> Void, failed: @escaping (String) -> Void) async {
        guard let url = URL(string: SecureConst.BASE_URL + Endpoint.servicesByTechId(techId)) else {
            LogKit.print("getServicesByTech Invalid URL"); failed("Failed")
            return
        }
        do {
            let response: ProvideServiceRequestRootRespond = try await url.createGETRequest().addAuthorizationHeader(userBase).performRequest()
            invoke(response.data)
        } catch {
            LogKit.print("Failed ->", error.localizedDescription); failed("Failed")
        }
    }
}
