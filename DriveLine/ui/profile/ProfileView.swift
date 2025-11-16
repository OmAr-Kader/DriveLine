//
//  ProfileView.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import SwiftUI
import SwiftUISturdy

struct ProfileView: View {

    let navigator: Navigator

    @Binding var app: BaseAppObserve
    @Binding var obs: HomeObserve

    @State private var path = NavigationPath()

    @State private var selectedPage: Int = 0
    
    var locationText: String {
        guard let location = obs.state.user?.location else { return "" }
        let components = [location.building ?? "", location.street ?? "", location.city ?? ""].filter { !$0.isEmpty }
        return (location.unit != nil ? "Unit: \(location.unit!) - " : "") + components.joined(separator: ", ")
    }
    
    var body: some View {
        ZStack {
            VStack {
                // Profile Image
                if let profileImage = obs.state.user?.image {
                    KingsImage(urlString: profileImage, size: CGSize(width: 120, height: 120), radius: 60, backColor: .backDarkSec)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(.primaryOfApp, lineWidth: 3)
                        )
                } else {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 120, height: 120)
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(.primaryOfApp, lineWidth: 3)
                        )
                }
                Spacer().height(10)
                // Name
                Text(app.state.userBase?.name ?? "")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.textOfApp)
                
                Spacer().height(10)
                // Location
                Text(locationText)
                    .font(.system(size: 16))
                    .foregroundColor(.textGray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .height(30)
                
                Spacer().height(10)
                
                ScrollView {
                    LazyVStack(spacing: 0) {
                        VStack(spacing: 0) {
                            TabView(selection: $selectedPage) {
                                ForEach(Array(obs.state.profileService.enumerated()), id: \.offset) { idx, data in
                                    ServiceCardImage(data: data)
                                        .onTapGesture {
                                            navigator.navigateToScreen(CreateEditFixServiceConfig(editService: data.service, serviceAdminId: data.fix.adminId), .CREATE_EDIT_FIX_SCREEN_ROUTE)
                                        }
                                }
                            }
                            .frame(height: 140)
                            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
                            Spacer().height(10)
                            HStack(spacing: 8) {
                                ForEach(0..<(obs.state.profileService.count), id: \.self) { idx in
                                    Circle()
                                        .fill(idx == selectedPage ? Color.blue : Color.gray.opacity(0.3))
                                        .frame(width: idx == selectedPage ? 10 : 8, height: idx == selectedPage ? 10 : 8)
                                        .animation(.easeInOut, value: selectedPage)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 6)
                        }.padding(.horizontal, 20)
                        
                        Spacer().height(10)
                        VStack {
                            ForEach(obs.state.profileCourses) { item in
                                CourseCardImage(data: item)
                                    .listRowBackground(Color.clear)
                                    .onTapGesture {
                                        navigator.navigateToScreen(CreateEditCourseConfig(editCourse: item.providedCourse, courseAdminId: item.course.adminId), .CREATE_EDIT_COURSE_ROUTE)
                                    }
                            }
                        }.padding(.horizontal, 20)
                        Spacer()
                    }
                }
            }
            if !obs.state.isEditSheet {
                LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: obs.state.isLoading)
            }
        }.apply {
            if !obs.state.isEditSheet {
                $0.toastView(toast: obs.toast, textColor: .textOfApp, backDarkSec: .backDarkSec)
            }
        }.onAppear {
            guard self.app.state.needUpdate else { return }
            self.app.setNeedUpdate(false)
            obs.fetchProfile(app.state.userBase)
        }.sheet(isPresented: obs.isEditSheet) {
            if let user = obs.state.user {
                EditProfileSheet(path: $path, user: user, toast: obs.toast, isLoading: obs.state.isLoading) {
                    obs.updateUser(userBase: app.state.userBase, userEdit: $0) { newUser in
                        app.updateUserBase(name: newUser.name, email: newUser.email) {
                            self.obs.offLoading(user: newUser)
                        }
                    }
                } onDismiss: {
                    self.obs.sheet(isEditSheet: false)
                }.presentationDetents([.large])
                    .presentationDragIndicator(.visible)
                    .id("SHEET_EDIT_PROFILE")
            } else {
                VStack {}
            }
        }
    }
    
}

struct EditProfileSheet: View {
    
    @State var userEdit: UserEdit
    @Binding var toast: Toast?
    let isLoading: Bool
    let onEdit: (UserEdit) -> Void
    let onDismiss: () -> Void
    @Binding private var path: NavigationPath
    
    init(path: Binding<NavigationPath>, user: User, toast: Binding<Toast?>, isLoading: Bool, onEdit: @escaping (UserEdit) -> Void, onDismiss: @escaping () -> Void) {
        self._path = path
        self._userEdit = State(wrappedValue: UserEdit(user: user))
        self._toast = toast
        self.isLoading = isLoading
        self.onEdit = onEdit
        self.onDismiss = onDismiss
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                ScrollView {
                    VStack(spacing: 25) {
                        
                        // Profile Image with tap gesture
                        Button(action: {
                            // Handle PhotoPicker here
                        }) {
                            ZStack {
                                if let profileImage = userEdit.image {
                                    KingsImage(urlString: profileImage, size: CGSize(width: 100, height: 100), radius: 60, backColor: .backDarkSec)
                                        .clipShape(Circle())
                                        .overlay(
                                            Circle()
                                                .stroke(.primaryOfApp, lineWidth: 3)
                                        )
                                } else {
                                    Image(systemName: "person.circle.fill")
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 100, height: 100)
                                        .clipShape(Circle())
                                        .overlay(
                                            Circle()
                                                .stroke(.primaryOfApp, lineWidth: 3)
                                        )
                                }
                                
                                // Camera icon overlay
                                VStack {
                                    Spacer()
                                    HStack {
                                        Spacer()
                                        Image(systemName: "camera.fill")
                                            .foregroundColor(.white)
                                            .font(.system(size: 16))
                                            .padding(8)
                                            //.background(Color(uiColor: .systemBackground))
                                            .clipShape(Circle())
                                            .offset(x: -5, y: -5)
                                    }
                                }
                                .frame(width: 100, height: 100)
                            }
                            .overlay(
                                Circle()
                                    .stroke(.primaryOfApp, lineWidth: 2)
                            )
                        }
                        .padding(.top, 10)
                        
                        // Form Fields
                        VStack(spacing: 16) {
                            // Name Field
                            EditTextField(
                                text: Binding(get: { userEdit.name }, set: { userEdit = userEdit.copy(name: .set($0)) }),
                                placeholder: "Name",
                                icon: "person.fill"
                            )
                            
                            EditTextField(
                                text: Binding(get: { userEdit.phone }, set: { userEdit = userEdit.copy(phone: .set($0)) }),
                                placeholder: "Phone",
                                icon: "phone.fill",
                                keyboard: .phonePad
                            )
                            
                            // Age Field
                            EditTextField(
                                text: Binding(get: { String(userEdit.age) }, set: {
                                    guard let age = Int($0) else { return }
                                    userEdit = userEdit.copy(age: .set(age))
                                }),
                                placeholder: "Age",
                                icon: "calendar",
                                keyboard: .numberPad
                            )
                            
                            // City Field
                            EditTextField(
                                text: Binding(get: { userEdit.city ?? "" }, set: { userEdit = userEdit.copy(city: .set($0)) }),
                                placeholder: "City",
                                icon: "building.2.fill"
                            )
                            
                            // Street Field
                            EditTextField(
                                text: Binding(get: { userEdit.street ?? "" }, set: { userEdit = userEdit.copy(street: .set($0)) }),
                                placeholder: "Street",
                                icon: "road.lanes"
                            )
                            
                            // Building Field
                            EditTextField(
                                text: Binding(get: { userEdit.building ?? "" }, set: { userEdit = userEdit.copy(building: .set($0)) }),
                                placeholder: "Building",
                                icon: "building.fill"
                            )
                            
                            // Unit Field
                            EditTextField(
                                text: Binding(get: { userEdit.unit ?? "" }, set: { userEdit = userEdit.copy(unit: .set($0)) }),
                                placeholder: "Unit",
                                icon: "door.left.hand.open"
                            )
                        }
                        .padding(.horizontal, 30)
                        .padding(.top, 10)
                    }
                }
                LoadingScreen(color: .primaryOfApp, backDarkAlpha: .backDarkAlpha, isLoading: isLoading)
            }.toastView(toast: $toast, textColor: .textOfApp, backDarkSec: .backDarkSec)
                .hideToolbar()
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close") {
                            guard !isLoading else { return }
                            onDismiss()
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            guard !isLoading else { return }
                            dismissKeyboard()
                            onEdit(userEdit)
                        }
                    }
                }
        }
    }
}

struct EditTextField: View {
    @Binding var text: String
    let placeholder: String
    let icon: String
    let keyboard: UIKeyboardType
    
    init(text: Binding<String>, placeholder: String, icon: String, keyboard: UIKeyboardType = .default) {
        self._text = text
        self.placeholder = placeholder
        self.icon = icon
        self.keyboard = keyboard
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.primaryOfApp)
                .frame(width: 20)
                .alignmentGuide(VerticalAlignment.center) { d in d[.top] + 10 }
            
            ZStack(alignment: .topLeading) {
                TextField(placeholder, text: $text)
                    .foregroundColor(.textOfApp)
                    .scrollContentBackground(.hidden)
                    .background(Color.clear)
                    .frame(height: 40)
                    .autocapitalization(.words)
                    .keyboardType(keyboard)
            }
        }
        .padding()
        .background(Color.white.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(.primaryOfApp.opacity(0.3), lineWidth: 1)
        )
    }
}



fileprivate struct ServiceCardImage: View {
    //let service: FixService
    let data: ProfileServiceData

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [data.fix.color.opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(data.fix.title)
                        .foregroundStyle(.white)
                        .font(.headline).bold()
                    VStack(alignment: .leading) {
                        Label {
                            Text(data.service.isActive ? "Active" : "Not Active")
                        } icon: {
                            Image(systemName: "circle.fill")
                                .foregroundColor(data.service.isActive ? Color.green : Color.red)
                        }.labelStyle(HorizontalLabelStyle(spacing: 4))
                    }.foregroundColor(.white)
                    
                    Spacer()
                    Label("\(data.service.price) \(data.service.currency)", systemImage: "dollarsign.circle")
                        .font(.subheadline)
                        .foregroundStyle(.textOfApp)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(12)
                Spacer()
                HStack {
                    Image(systemName: data.fix.iconName)
                        .font(.title2).bold()
                        .padding(8)
                        .background(Color.white.opacity(0.16))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }.padding(15).onBottomEnd()
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}



fileprivate struct CourseCardImage: View {
    //let service: FixService
    let data: ProfileCourseData

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            HStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient(colors: [(data.course.gradient.first ?? .gray).opacity(0.25), Color(.systemBackground).opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .background(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
                
            }
            LinearGradient(colors: [.black.opacity(0.0), .black.opacity(0.38)], startPoint: .center, endPoint: .bottom)
            HStack {
                VStack(alignment: .leading) {
                    Text(data.course.title)
                        .foregroundStyle(.white)
                        .font(.headline).bold()
                    VStack(alignment: .leading) {
                        Label {
                            Text(data.providedCourse.isActive ? "Active" : "Not Active")
                        } icon: {
                            Image(systemName: "circle.fill")
                                .foregroundColor(data.providedCourse.isActive ? Color.green : Color.red)
                        }.labelStyle(HorizontalLabelStyle(spacing: 4))
                    }.foregroundColor(.white)
                    
                    Spacer()
                    Label("\(data.providedCourse.price) \(data.providedCourse.currency)", systemImage: "dollarsign.circle")
                        .font(.subheadline)
                        .foregroundStyle(.textOfApp)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(12)
                Spacer()
                HStack {
                    Label("\(data.providedCourse.sessions)", systemImage: "flag")
                        .font(.subheadline)
                        .foregroundStyle(.textHint)
                        .labelStyle(HorizontalLabelStyle(spacing: 4))
                }.padding(15).onBottomEnd()
            }
        }
        .cornerRadius(14)
        .shadow(color: Color.black.opacity(0.12), radius: 8, x: 0, y: 6)
    }
}
