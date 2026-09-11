package com.senai.demo.security;

import java.util.UUID;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.senai.demo.entity.Profile;
import com.senai.demo.repository.ProfileRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final ProfileRepository profileRepository;

    public CustomUserDetailsService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Profile profile = profileRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));

        return new CustomUserPrincipal(profile);
    }

    public UserDetails loadUserById(String userId) throws UsernameNotFoundException {
        try {
            UUID uuid = UUID.fromString(userId);
            Profile profile = profileRepository.findById(uuid)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + userId));
            return new CustomUserPrincipal(profile);
        } catch (IllegalArgumentException ex) {
            throw new UsernameNotFoundException("UUID inválido: " + userId);
        }
    }
}
