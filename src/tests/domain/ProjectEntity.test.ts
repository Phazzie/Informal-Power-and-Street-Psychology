import { describe, it, expect } from 'vitest';
import { ProjectEntity } from '../../domain/ProjectEntity';

describe('ProjectEntity Domain Model', () => {
  it('should instantiate correctly from DTO', () => {
    const dto = {
      id: 'proj-123',
      name: 'Test Project',
      conversations: []
    };
    const entity = ProjectEntity.fromDTO(dto);
    expect(entity.id).toBe('proj-123');
    expect(entity.name).toBe('Test Project');
  });

  it('should reject invalid instantiation', () => {
    expect(() => new ProjectEntity('', 'Test')).toThrow('Project ID cannot be empty');
    expect(() => new ProjectEntity('proj-123', '')).toThrow('Project name cannot be empty');
  });

  it('should add valid conversations and reject duplicates', () => {
    const entity = new ProjectEntity('proj-1', 'Name');
    entity.addConversation('convo-1', 'First Convo');
    
    expect(entity.conversations.length).toBe(1);
    expect(entity.conversations[0].id).toBe('convo-1');
    
    // Duplicate ID
    expect(() => entity.addConversation('convo-1', 'Second Convo')).toThrow('exists');
  });

  it('should add valid messages', () => {
    const entity = new ProjectEntity('proj-1', 'Name');
    entity.addConversation('convo-1', 'First Convo');
    
    entity.addMessage('convo-1', { role: 'user', content: 'Hello!' });
    expect(entity.conversations[0].messages.length).toBe(1);
    
    // Invalid conversation ID
    expect(() => entity.addMessage('wrong-id', { role: 'user', content: 'Hello' })).toThrow('not found');
    
    // Invalid content
    expect(() => entity.addMessage('convo-1', { role: 'assistant', content: '   ' })).toThrow('empty');
  });

  it('should generate a safe clone for React state updates', () => {
    const entity = new ProjectEntity('proj-1', 'Name');
    entity.addConversation('convo-1', 'First Convo');
    
    const clone = entity.clone();
    expect(clone).not.toBe(entity); // Different memory reference
    expect(clone.conversations).not.toBe(entity.conversations);
    expect(clone.id).toBe(entity.id);
  });
});
