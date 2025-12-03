//
//  FixServicesObserve.swift
//  DriveLine
//
//  Created by OmAr Kader on 15/11/2025.
//

import SwiftUI
import SwiftUISturdy
import SwiftUIMacroSturdy
import Observation

@MainActor
@Observable
final class FixServicesObserve : BaseObserver {
    
    @MainActor
    private(set) var state: FixServicesState = FixServicesState()

    init() {
        @Inject
        var pro: Project
        super.init(project: pro)
    }
    
    var toast: Binding<Toast?> {
        Binding {
            self.state.toast
        } set: { newValue in
            self.state = self.state.copy(toast: .set(newValue))
        }
    }
    
    func loadFixServices(userBase: UserBase?, service: FixService) {
        guard let userBase else { return }
        self.state = self.state.copy(isLoading: .set(true), service: .set(service))
        self.tasker.back {
            await self.project.fix.getServicesByServiceAdminId(userBase: userBase, serviceAdminId: service.adminId) { list in
                self.mainSync {
                    let listOfService = list.map({ GetAServiceData(cloud: $0) })
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false),listOfService: .set(listOfService))
                    }
                }
            } failed: { _ in
                self.mainSync {
                    withAnimation {
                        self.state = self.state.copy(isLoading: .set(false), toast: .set(Toast(style: .error, message: "Failed")))
                    }
                }
            }
        }
    }
    
    @SturdyCopy
    struct FixServicesState {

        private(set) var isLoading: Bool = false
        private(set) var toast: Toast? = nil
        
        private(set) var listOfService: [GetAServiceData] = []
        
        private(set) var service: FixService? = nil
    }
    
}
