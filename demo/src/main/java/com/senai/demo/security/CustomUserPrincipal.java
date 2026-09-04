package com.senai.demo.security;

import java.util.Arrays;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.senai.demo.entity.Profile;

public class CustomUserPrincipal implements UserDetails {

    private static final long serialVersionUID = 1L;

    private final Profile profile;

    public CustomUserPrincipal(Profile profile) {
        this.profile = profile;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Arrays.asList(
            new SimpleGrantedAuthority("ROLE_" + profile.getRole().name())
        );
    }

    @Override
    public String getPassword() {
        return profile.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return profile.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return profile.getDeletedAt() == null;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return profile.getDeletedAt() == null;
    }

    public Profile getProfile() {
        return profile;
    }
}
