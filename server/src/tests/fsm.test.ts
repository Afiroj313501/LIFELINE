import { describe, it, expect } from 'vitest';
import { RequestStatus } from '@prisma/client';
import { ALLOWED_TRANSITIONS } from '../modules/blood-requests/blood-requests.service';

describe('Emergency Blood Request Finite State Machine (FSM)', () => {
  it('Terminal states cannot transition anywhere (empty transition array)', () => {
    const terminalStates = [
      RequestStatus.FULFILLED,
      RequestStatus.REJECTED,
      RequestStatus.CANCELLED,
      RequestStatus.EXPIRED,
    ];

    terminalStates.forEach((state) => {
      expect(ALLOWED_TRANSITIONS[state]).toEqual([]);
    });
  });

  it('PENDING state transitions correctly', () => {
    const allowed = ALLOWED_TRANSITIONS[RequestStatus.PENDING];
    expect(allowed).toContain(RequestStatus.UNDER_REVIEW);
    expect(allowed).toContain(RequestStatus.CANCELLED);
    expect(allowed).toContain(RequestStatus.EXPIRED);
    // Cannot jump straight to FULFILLED without donor verification
    expect(allowed).not.toContain(RequestStatus.FULFILLED);
  });

  it('UNDER_REVIEW state can be VERIFIED or REJECTED by staff', () => {
    const allowed = ALLOWED_TRANSITIONS[RequestStatus.UNDER_REVIEW];
    expect(allowed).toContain(RequestStatus.VERIFIED);
    expect(allowed).toContain(RequestStatus.REJECTED);
  });

  it('VERIFIED request can advance to BROADCASTING', () => {
    const allowed = ALLOWED_TRANSITIONS[RequestStatus.VERIFIED];
    expect(allowed).toContain(RequestStatus.BROADCASTING);
  });

  it('BROADCASTING advances to DONOR_RESPONDED when donor accepts', () => {
    const allowed = ALLOWED_TRANSITIONS[RequestStatus.BROADCASTING];
    expect(allowed).toContain(RequestStatus.DONOR_RESPONDED);
  });

  it('DONOR_RESPONDED can advance to FULFILLED upon successful transfusion', () => {
    const allowed = ALLOWED_TRANSITIONS[RequestStatus.DONOR_RESPONDED];
    expect(allowed).toContain(RequestStatus.FULFILLED);
  });

  it('Disallowed reverse transitions are blocked', () => {
    // FULFILLED cannot be undone back to PENDING or BROADCASTING
    expect(ALLOWED_TRANSITIONS[RequestStatus.FULFILLED]).not.toContain(RequestStatus.PENDING);
    expect(ALLOWED_TRANSITIONS[RequestStatus.FULFILLED]).not.toContain(RequestStatus.BROADCASTING);
    // CANCELLED cannot revive to VERIFIED
    expect(ALLOWED_TRANSITIONS[RequestStatus.CANCELLED]).not.toContain(RequestStatus.VERIFIED);
  });
});
