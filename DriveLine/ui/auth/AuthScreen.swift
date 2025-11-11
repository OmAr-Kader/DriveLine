//
//  AuthScreen.swift
//  DriveLine
//
//  Created by OmAr Kader on 08/11/2025.
//

import SwiftUI
import SwiftUISturdy

@MainActor
struct AuthScreen: View {

    @Binding var app: BaseAppObserve
    let navigator: Navigator
    
    let obs: AuthAppObserve = AuthAppObserve()
    
    @State private var isRegistering = false
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @FocusState private var focusedField: AuthField?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 30) {
                Spacer()
                
                // Title
                HStack {
                    Image.initial("AppIcon".forImage())
                        .frame(width: 40, height: 40)
                    Spacer().width(10)
                    Text(isRegistering ? "Create Account" : "Welcome Back")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.textOfApp)
                        .animation(.easeInOut, value: isRegistering)
                }
                
                VStack(spacing: 16) {
                    // Name field (only for register)
                    if isRegistering {
                        CustomTextEditor(
                            text: $name,
                            placeholder: "Name",
                            icon: "person.fill",
                            type: (.name, .default),
                            focusedField: $focusedField,
                            field: .name,
                            onSubmit: nextFocus
                        )
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    }
                    
                    // Email field
                    CustomTextEditor(
                        text: $email,
                        placeholder: "Email",
                        icon: "envelope.fill",
                        type: (.username, .emailAddress),
                        focusedField: $focusedField,
                        field: .email,
                        onSubmit: nextFocus
                    )
                    
                    // Phone field (only for register)
                    if isRegistering {
                        CustomTextEditor(
                            text: $phone,
                            placeholder: "Phone",
                            icon: "phone.fill",
                            type: (.telephoneNumber, .phonePad),
                            focusedField: $focusedField,
                            field: .phone,
                            onSubmit: nextFocus
                        )
                        .transition(.opacity.combined(with: .move(edge: .top)))
                    }
                    
                    // Password field
                    CustomSecureTextEditor(
                        text: $password,
                        placeholder: "Password",
                        icon: "lock.fill",
                        type: (isRegistering ? .newPassword : .password, .default),
                        focusedField: $focusedField,
                        field: .password,
                        onSubmit: loginRegister
                    )
                }
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isRegistering)
                .padding(.horizontal, 30)
                
                // Action Button
                Button(action: loginRegister) {
                    if obs.state.isLoading {
                        ProgressView()
                            .progressViewStyle(.circular)
                    } else {
                        Text(isRegistering ? "Sign Up" : "Sign In")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.textForPrimary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 55)
                            .cornerRadius(12)
                            .apply {
                                if #available(iOS 26.0, *) {
                                    $0.glassEffect(.regular.tint(.primaryOfApp).interactive())
                                } else {
                                    $0.background(.primaryOfApp)
                                        .clipShape(.capsule)
                                    // Fallback on earlier versions
                                }
                            }
                    }
                }
                .padding(.horizontal, 30)
                .padding(.top, 10)
                
                // Toggle between login/register
                Button(action: {
                    withAnimation {
                        isRegistering.toggle()
                        // Clear fields when switching
                        if !isRegistering {
                            name = ""
                            phone = ""
                        }
                    }
                }) {
                    HStack(spacing: 4) {
                        Text(isRegistering ? "Already have an account?" : "Don't have an account?")
                            .foregroundColor(.textGray)
                        Text(isRegistering ? "Sign In" : "Sign Up")
                            .foregroundColor(.primaryOfApp)
                            .fontWeight(.semibold)
                    }
                    .font(.system(size: 15))
                }
                .padding(.top, 5)
                
                Spacer()
            }.hideToolbar()
                .toolbar(content: toolBarView)
                .toastView(toast: obs.toast, textColor: .textOfApp, backDarkSec: .backDarkSec)
        }
    }
    
    
    @ToolbarContentBuilder
    func toolBarView() -> some ToolbarContent {
        ToolbarItemGroup(placement: .keyboard) {
            Button("Close") {
                focusedField = nil
                //dismissKeyboard()
            }
            Spacer()
            if focusedField != .password {
                Button("Next", action: nextFocus)
            }
        }
    }
    
    func nextFocus() {
        let nextField: AuthField? = switch focusedField {
        case .name: .email
        case .email: isRegistering ? .phone : .password
        case .phone: .password
        case .password: nil
        case .none:
            nil
        }
        focusedField = nextField
    }
    
    func loginRegister() {
        guard !obs.state.isLoading else { return }
        focusedField = nil
        if isRegistering {
            obs.register(name: name, email: email, phone: phone, password: password) {
                app.updateUserBase(userBase: UserBase(id: $0.user.id, name: $0.user.name, email: $0.user.email, accountType: $0.user.role, token: $0.token)) {
                    navigator.navigateMain(.HOME_SCREEN_ROUTE)
                }
            }
        } else {
            obs.login(email: email, password: password) {
                app.updateUserBase(userBase: UserBase(id: $0.user.id, name: $0.user.name, email: $0.user.email, accountType: $0.user.role, token: $0.token)) {
                    navigator.navigateMain(.HOME_SCREEN_ROUTE)
                }
            }
        }
    }
}

fileprivate struct CustomTextEditor: View {
    @Binding var text: String
    let placeholder: String
    let icon: String
    let type: (UITextContentType, UIKeyboardType)
    @FocusState.Binding var focusedField: AuthField?
    let field: AuthField
    let onSubmit: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(Color(.primaryOfApp))
                .frame(width: 20)
                .alignmentGuide(VerticalAlignment.center) { d in d[.top] + 10 }
            
            ZStack(alignment: .topLeading) {
                TextField(placeholder, text: $text)
                    .foregroundColor(.textOfApp)
                    .scrollContentBackground(.hidden)
                    .background(Color.clear)
                    .lineLimit(1)
                    .frame(height: 35)
                    .autocapitalization(.none)
                    .autocorrectionDisabled(false)
                    .keyboardType(type.1)
                    .textContentType(type.0)
                    .focused($focusedField, equals: field)
                    .submitLabel(.next)
                    .onSubmit(onSubmit)
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

fileprivate struct CustomSecureTextEditor: View {
    @Binding var text: String
    let placeholder: String
    let icon: String
    let type: (UITextContentType, UIKeyboardType)
    @FocusState.Binding var focusedField: AuthField?
    let field: AuthField
    let onSubmit: () -> Void
    
    // For toggling visibility
    @State private var isSecure: Bool = true
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(Color(.primaryOfApp))
                .frame(width: 20)
                .alignmentGuide(VerticalAlignment.center) { d in d[.top] + 10 }
            
            ZStack(alignment: .topLeading) {
                // Normal TextEditor (shows dots instead of text manually)
                TextField(placeholder, text: Binding(
                    get: { isSecure ? String(repeating: "•", count: text.count) : text },
                    set: { newValue in
                        // Replace secure dots input manually
                        if isSecure {
                            if newValue.count < text.count {
                                text.removeLast()
                            } else if newValue.count > text.count {
                                let addedChar = newValue.suffix(newValue.count - text.count)
                                text.append(contentsOf: addedChar)
                            }
                        } else {
                            text = newValue
                        }
                    }
                ))
                .foregroundColor(.textOfApp)
                .scrollContentBackground(.hidden)
                .background(Color.clear)
                .lineLimit(1)
                .frame(height: 35)
                .autocapitalization(.none)
                .autocorrectionDisabled(false)
                .keyboardType(type.1)
                .textContentType(type.0)
                .focused($focusedField, equals: field)
                .submitLabel(.go)
                .onSubmit(onSubmit)
            }
            
            // Eye icon toggle for show/hide
            Button(action: {
                isSecure.toggle()
            }) {
                Image(systemName: isSecure ? "eye.slash.fill" : "eye.fill")
                    .foregroundColor(.textGray)
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


// Helper extension for placeholder
extension View {
    func placeholder<Content: View>(
        when shouldShow: Bool,
        alignment: Alignment = .leading,
        @ViewBuilder placeholder: () -> Content) -> some View {
        
        ZStack(alignment: alignment) {
            placeholder().opacity(shouldShow ? 1 : 0)
            self
        }
    }
}


fileprivate enum AuthField: Hashable {
    case name, email, phone, password
}
