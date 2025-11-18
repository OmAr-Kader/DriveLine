//
//  ViewServiceScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 15/11/2025.
//

import SwiftUI
import SwiftUISturdy

struct ViewServiceScreen: View {
    
    let navigator: Navigator
    
    @State private var data: ViewServiceData?
    
    var body: some View {
        ZStack {
            if let data = data {
                ViewService(navigator: navigator, data: data)
            }
        }.visibleToolbar().navigationTitle(data?.fix.title ?? "")
            .onAppeared {
                // Example load (simulate edit). Only load once.
                guard let config = navigator.screenConfig(.SERVICE_SCREEN) as? ServiceConfig else { return }
                self.data = config.service
            }
    }
}


fileprivate struct ViewService : View {
    
    let navigator: Navigator
    
    let data: ViewServiceData
    
    @State private var selectedPage: Int = 0
  
    @State var selectedDay: WeekDay = .monday

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .center) {
                if !data.data.images.isEmpty {
                    VStack {
                        TabView(selection: $selectedPage) {
                            ServiceCardImage(service: data.fix, tech: data.data.tech)
                                .frame(height: 140)
                                .tag(0)
                            ForEach(Array(data.data.images.enumerated()), id: \.offset) { idx, url in
                                AsyncImage(url: URL(string: url)) { phase in
                                    switch phase {
                                    case .empty:
                                        ProgressView()
                                    case .success(let img):
                                        img.resizable().scaledToFit()
                                    case .failure:
                                        Image(systemName: "person.fill")
                                            .resizable()
                                            .scaledToFit()
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                    @unknown default:
                                        Image(systemName: "person.fill")
                                    }
                                }
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .tag(idx + 1)
                            }
                        }
                        .frame(height: 140)
                        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                        Spacer().height(10)
                        HStack(spacing: 8) {
                            ForEach(0..<(data.data.images.count + 1), id: \.self) { idx in
                                Circle()
                                    .fill(idx == selectedPage ? .primaryOfApp : Color.gray.opacity(0.3))
                                    .frame(width: idx == selectedPage ? 10 : 8, height: idx == selectedPage ? 10 : 8)
                                    .animation(.easeInOut, value: selectedPage)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 6)
                    }.padding(.horizontal, 20)
                } else {
                    ServiceCardImage(service: data.fix, tech: data.data.tech)
                        .frame(height: 140)
                        .padding(.horizontal, 20)
                }
            }
            Form {
                Section(header: Text("Service info")) {
                    Text(data.data.description)
                        .font(.headline)
                    
                    HStack {
                        Text("\(data.data.price) \(data.data.currency)")
                        Spacer()
                        Text("\(data.data.durationMinutes) minutes")
                    }
                }
                
                Section(header: Text("Edit availability — pick a day")) {
                    Picker("", selection: $selectedDay) {
                        ForEach(WeekDay.allCases) { day in
                            Text(day.short).tag(day)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.vertical, 4)
                    
                    DayAvailability(
                        day: selectedDay,
                        interval: data.availabilities[selectedDay] ?? nil,
                        // Simple start binding: if no interval -> nil, setting start creates single-hour (start==end)
                        selectedStart: data.availabilities[selectedDay]??.startUTC,
                        // Simple end binding: if no interval -> nil, setting end creates single-hour (start==end)
                        selectedEnd: data.availabilities[selectedDay]??.endUTC,
                    )
                }
            }.padding(.horizontal, 10)
            HStack {
                    Spacer()
                    Button {
                        callNumber(data.data.tech.phone)
                    } label: {
                        Label("Call", systemImage: "phone")
                            .tint(.white)
                            .foregroundStyle(.white)
                    }.frame(width: 200, height: 40)
                        .apply {
                            if #available(iOS 26.0, *) {
                                $0.glassEffect(.regular.tint(Color(#colorLiteral(red: 0.158376148, green: 0.5596875, blue: 0.2356460614, alpha: 1))).interactive())
                            } else {
                                $0.clipShape(.capsule)
                                    .background(Color(#colorLiteral(red: 0.158376148, green: 0.5596875, blue: 0.2356460614, alpha: 1)))
                            }
                        }
                        .listRowBackground(Color.clear)
                Spacer()
                Button {
                    mailto(data.data.tech.email)
                } label: {
                    Label("Mail", systemImage: "envelope.fill")
                }.frame(width: 120, height: 40)
                    .apply {
                        if #available(iOS 26.0, *) {
                            $0.glassEffect(.regular.tint(.primaryOfApp).interactive())
                        } else {
                            $0.clipShape(.capsule)
                                .background(.primaryOfApp)
                        }
                    }
                    .listRowBackground(Color.clear)
                Spacer()
            }
        }
    }
    
    func callNumber(_ phoneNumber: String) {
        if let phoneURL = URL(string: "tel://\(phoneNumber)") {
            if UIApplication.shared.canOpenURL(phoneURL) {
                UIApplication.shared.open(phoneURL, options: [:], completionHandler: nil)
            }
        }
    }
    
    func mailto(_ mail: String) {
        if let phoneURL = URL(string: "mailto:\(mail)") {
            if UIApplication.shared.canOpenURL(phoneURL) {
                UIApplication.shared.open(phoneURL, options: [:], completionHandler: nil)
            }
        }
    }
}

fileprivate struct ServiceCardImage: View {
    let service: FixService
    let tech: GetAServiceData.Tech?

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [service.color.opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(tech?.name ?? "")
                        .foregroundStyle(.white)
                        .font(.subheadline).bold()
                    VStack(alignment: .leading) {
                        Text(tech?.locationStr ?? "")
                            .foregroundStyle(.white)
                            .font(.caption2)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }.foregroundColor(.white)
                    Spacer()
                    HStack(alignment: .center, spacing: 10) {
                        Image(systemName: service.iconName)
                            .font(.title2).bold()
                            .padding(8)
                            .background(Color.white.opacity(0.16))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        
                        Spacer()
                    }
                }.padding(12)
                Spacer()
                if let image = tech?.image,  let url = URL(string: image) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .empty:
                            ProgressView()
                        case .success(let img):
                            img.resizable().scaledToFill()
                        case .failure:
                            Image(systemName: "person.fill")
                                .resizable()
                                .scaledToFit()
                        @unknown default:
                            Image(systemName: "person.fill")
                        }
                    }
                    .frame(size: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .onEnd()
                }
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}
