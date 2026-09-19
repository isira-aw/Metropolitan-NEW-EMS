package com.ems.service;

import com.ems.dto.GeneratorRequest;
import com.ems.entity.Generator;
import com.ems.entity.MainTicket;
import com.ems.entity.JobStatus;
import com.ems.repository.GeneratorRepository;
import com.ems.repository.MainTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeneratorService {
    
    @Autowired
    private GeneratorRepository generatorRepository;

    @Autowired
    private MainTicketRepository mainTicketRepository;
    
    public Generator createGenerator(GeneratorRequest request) {
        Generator generator = new Generator();
        generator.setModel(request.getModel());
        generator.setName(request.getName());
        generator.setCapacity(request.getCapacity());
        generator.setLocationName(request.getLocationName());
        generator.setOwnerEmail(request.getOwnerEmail());
        generator.setWhatsAppNumber(request.getWhatsAppNumber());
        generator.setLandlineNumber(request.getLandlineNumber());
        generator.setNote(request.getNote());
        
        return generatorRepository.save(generator);
    }
    
    public Page<Generator> getAllGenerators(Pageable pageable) {
        return generatorRepository.findAll(pageable);
    }
    
    public Generator getGeneratorById(Long id) {
        return generatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Generator not found"));
    }
    
    public Generator updateGenerator(Long id, GeneratorRequest request) {
        Generator generator = getGeneratorById(id);
        
        generator.setModel(request.getModel());
        generator.setName(request.getName());
        generator.setCapacity(request.getCapacity());
        generator.setLocationName(request.getLocationName());
        generator.setOwnerEmail(request.getOwnerEmail());
        generator.setWhatsAppNumber(request.getWhatsAppNumber());
        generator.setLandlineNumber(request.getLandlineNumber());
        generator.setNote(request.getNote());
        
        return generatorRepository.save(generator);
    }
    
    public void deleteGenerator(Long id) {
        // Verify the generator exists first so a bad id is a clear "not found"
        // rather than a silent no-op (deleteById ignores missing rows).
        getGeneratorById(id);

        // main_tickets.generator_id is a NOT NULL foreign key, so deleting a
        // generator that still has tickets raises a DataIntegrityViolationException
        // that the global handler renders as "An unexpected error occurred". Check
        // up front and explain what is actually blocking the delete.
        long ticketCount = mainTicketRepository.countByGeneratorId(id);
        if (ticketCount > 0) {
            throw new RuntimeException("Cannot delete this generator - it still has "
                    + ticketCount + " ticket(s) linked to it. Delete or reassign those tickets first.");
        }

        generatorRepository.deleteById(id);
    }

    public Page<Generator> searchByName(String name, Pageable pageable) {
        return generatorRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    public Page<Generator> searchByLocation(String location, Pageable pageable) {
        return generatorRepository.findByLocationNameContainingIgnoreCase(location, pageable);
    }

    public Map<String, Object> getGeneratorStatistics(Long id) {
        Generator generator = getGeneratorById(id);

        // Filter by generator in the database rather than loading every ticket in the
        // system and discarding most of them in memory. Same result, one indexed
        // lookup instead of a full table scan.
        List<MainTicket> allTickets = mainTicketRepository
                .findByGeneratorId(id, Pageable.unpaged())
                .getContent();

        long totalTickets = allTickets.size();
        long completedTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.COMPLETED)
                .count();
        long pendingTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.PENDING)
                .count();
        long activeTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.STARTED ||
                        t.getStatus() == JobStatus.TRAVELING)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("generatorId", id);
        stats.put("generatorName", generator.getName());
        stats.put("totalTickets", totalTickets);
        stats.put("completedTickets", completedTickets);
        stats.put("pendingTickets", pendingTickets);
        stats.put("activeTickets", activeTickets);
        stats.put("completionRate", totalTickets > 0 ? (completedTickets * 100.0 / totalTickets) : 0);

        return stats;
    }
}
