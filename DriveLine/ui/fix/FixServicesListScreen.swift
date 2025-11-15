//
//  FixServicesListScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 15/11/2025.
//

import SwiftUI
import SwiftUISturdy
import Foundation

struct FixServicesListScreen: View {
    
    @Binding var app: BaseAppObserve
    let navigator: Navigator
    
    @State
    private var obs: FixServicesObserve = FixServicesObserve()
   
    var body: some View {
        ZStack {
            VStack {
                List {
                    ForEach(obs.state.listOfService) { item in
                        ServiceCardImage(data: item)
                            .listRowBackground(Color.clear)
                            .onTapGesture {
                                guard let service = obs.state.service else { return }
                                navigator.navigateToScreen(ServiceConfig(service: ViewServiceData(fix: service, data: item)), .SERVICE_SCREEN)
                            }
                    }
                }
            }
            LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.state.isLoading)
        }.visibleToolbar()
            .navigationTitle(obs.state.service?.title ?? "")
            .onAppeared {
                guard let config = navigator.screenConfig(.SERVICES_LIST_SCREEN) as? ServicesListConfig, let userBase = app.state.userBase else {
                    return
                }
                LogKit.print(config.service.title)
                obs.loadFixServices(userBase: userBase, service: config.service)
            }.toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        guard let service = obs.state.service else { return }
                        navigator.navigateToScreen(CreateEditFixServiceConfig(editService: nil, serviceAdminId: service.adminId), .CREATE_EDIT_FIX_SCREEN_ROUTE)
                    } label: {
                        Text("Join")
                    }
                }
            }
    }
}


fileprivate struct ServiceCardImage: View {
    //let service: FixService
    let data: GetAServiceData

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [.backDarkSec.opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(data.tech.name)
                        .foregroundStyle(.white)
                        .font(.headline).bold()
                    VStack(alignment: .leading) {
                        Text(data.tech.location?.city ?? "")
                            .foregroundStyle(.textHint)
                            .font(.subheadline)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: true, vertical: false)
                    }.foregroundColor(.white)
                    Label("\(data.durationMinutes) m", systemImage: "clock")
                        .font(.subheadline)
                        .foregroundStyle(.textHint)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                    
                    Spacer()
                    Label("\(data.price) \(data.currency)", systemImage: "dollarsign.circle")
                        .font(.subheadline)
                        .foregroundStyle(.textOfApp)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(12)
                Spacer()
                if let image = data.tech.image {
                    KingsImage(urlString: image, size: CGSize(140), radius: 10)
                        .onEnd()
                }
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}

public struct HorizontalLabelStyle: LabelStyle {
    private let spacing: CGFloat
    private let alignment: VerticalAlignment
    
    public init(spacing: CGFloat = 4, alignment: VerticalAlignment = .center) {
        self.spacing = spacing
        self.alignment = alignment
    }

    public func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: alignment, spacing: spacing) {
            configuration.icon
            configuration.title
        }
    }
}


public struct VerticalLabelStyle: LabelStyle {
    private let spacing: CGFloat
    private let alignment: HorizontalAlignment
    
    public init(spacing: CGFloat = 4, alignment: HorizontalAlignment = .center) {
        self.spacing = spacing
        self.alignment = alignment
    }
    public func makeBody(configuration: Configuration) -> some View {
        VStack(alignment: alignment, spacing: spacing) {
            configuration.icon
            configuration.title
        }
    }
}
