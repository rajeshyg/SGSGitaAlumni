let pool = null;

export const setDashboardPool = (dbPool) => {
	pool = dbPool;
};

const safeParseArray = (value) => {
	if (!value) {
		return [];
	}

	if (Array.isArray(value)) {
		return value.filter(Boolean);
	}

	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
		} catch (error) {
			console.warn('[dashboard] Failed to parse JSON array value:', value);
			return [];
		}
	}

	return [];
};

const uniqueStrings = (values) => {
	return Array.from(new Set(values.filter(Boolean)));
};

const normalizeDomain = (domainRow) => {
	if (!domainRow) {
		return null;
	}

	return {
		id: String(domainRow.id),
		name: domainRow.name,
		description: domainRow.description,
		icon: domainRow.icon,
		colorCode: domainRow.color_code,
		domainLevel: domainRow.domain_level,
		parentDomainId: domainRow.parent_domain_id
	};
};

const calculateProfileCompletion = (userRow, preferences) => {
	const checks = [
		{ key: 'first_name', label: 'First name', complete: Boolean(userRow.first_name) },
		{ key: 'last_name', label: 'Last name', complete: Boolean(userRow.last_name) },
		{ key: 'current_position', label: 'Current position', complete: Boolean(userRow.current_position) },
		{ key: 'company', label: 'Company', complete: Boolean(userRow.company) },
		{ key: 'location', label: 'Location', complete: Boolean(userRow.location) },
		{ key: 'linkedin_url', label: 'LinkedIn URL', complete: Boolean(userRow.linkedin_url) },
		{ key: 'bio', label: 'Bio', complete: Boolean(userRow.bio) },
		{ key: 'profile_image_url', label: 'Profile photo', complete: Boolean(userRow.profile_image_url) }
	];

	if (preferences) {
		checks.push({ key: 'primary_domain', label: 'Primary domain preference', complete: Boolean(preferences.primaryDomain) });
		checks.push({ key: 'secondary_domains', label: 'Secondary domains', complete: (preferences.secondaryDomains || []).length > 0 });
	} else {
		checks.push({ key: 'primary_domain', label: 'Primary domain preference', complete: false });
		checks.push({ key: 'secondary_domains', label: 'Secondary domains', complete: false });
	}

	const completed = checks.filter((item) => item.complete).length;
	const percent = checks.length === 0 ? 0 : Math.round((completed / checks.length) * 100);
	const missing = checks.filter((item) => !item.complete).map((item) => item.label);

	return {
		percent,
		missing
	};
};

const computeSharedAttributes = (currentUser, comparableUser, preferences) => {
	const attributes = [];

	if (currentUser.graduation_year && comparableUser.graduation_year && Number(currentUser.graduation_year) === Number(comparableUser.graduation_year)) {
		attributes.push(`Class of ${currentUser.graduation_year}`);
	}

	if (preferences?.primaryDomain && comparableUser.primary_domain_id && preferences.primaryDomain.id === comparableUser.primary_domain_id) {
		attributes.push(preferences.primaryDomain.name);
	}

	if (comparableUser.department) {
		attributes.push(comparableUser.department);
	}

	if (comparableUser.company) {
		attributes.push(comparableUser.company);
	}

	return uniqueStrings(attributes).slice(0, 3);
};

const createSummary = (userRow, profileCompletion, preferences) => {
	const now = new Date();
	const hour = now.getHours();
	let greeting = 'Hello';

	if (hour < 12) {
		greeting = 'Good morning';
	} else if (hour < 18) {
		greeting = 'Good afternoon';
	} else {
		greeting = 'Good evening';
	}

	const firstName = userRow.first_name || 'Member';

	return {
		greeting,
		firstName,
		lastName: userRow.last_name || '',
		fullName: `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim() || firstName,
		avatarUrl: userRow.profile_image_url || null,
		lastLoginAt: userRow.last_login_at,
		memberSince: userRow.created_at,
		profileCompletion: profileCompletion.percent,
		missingProfileFields: profileCompletion.missing,
		primaryDomain: preferences?.primaryDomain || null,
		graduationYear: userRow.graduation_year || null,
		location: userRow.location || null,
		currentPosition: userRow.current_position || null,
		company: userRow.company || null
	};
};

const buildQuickActions = ({ profileCompletion, hasPreferences, pendingInvitations, matchedOpportunitiesCount }) => {
	const actions = [];

	actions.push({
		id: 'complete-profile',
		label: profileCompletion.percent >= 90 ? 'View Profile' : 'Complete Profile',
		description: profileCompletion.percent >= 90 ? 'Keep your profile up to date.' : 'Finish setting up your profile to get better matches.',
		icon: 'user-circle',
		href: '/profile/edit',
		priority: profileCompletion.percent >= 90 ? 'secondary' : 'high',
		badge: `${profileCompletion.percent}%`
	});

	actions.push({
		id: 'manage-preferences',
		label: hasPreferences ? 'Refine Interests' : 'Choose Interests',
		description: hasPreferences ? 'Adjust your domains and areas of focus.' : 'Select domains to receive relevant opportunities.',
		icon: 'sliders',
		href: '/preferences',
		priority: hasPreferences ? 'medium' : 'high'
	});

	actions.push({
		id: 'alumni-directory',
		label: 'Browse Directory',
		description: 'Find and connect with alumni across batches and domains.',
		icon: 'users',
		href: '/alumni-directory',
		priority: 'medium'
	});

	actions.push({
		id: 'view-opportunities',
		label: matchedOpportunitiesCount > 0 ? 'Matched Opportunities' : 'Explore Opportunities',
		description: matchedOpportunitiesCount > 0
			? 'Review the opportunities tailored to your interests.'
			: 'Discover postings shared by the alumni community.',
		icon: 'target',
		href: '/postings',
		priority: matchedOpportunitiesCount > 0 ? 'high' : 'medium',
		badge: matchedOpportunitiesCount > 0 ? `${matchedOpportunitiesCount}` : undefined
	});

	if (pendingInvitations > 0) {
		actions.unshift({
			id: 'pending-invitations',
			label: 'Review Invitations',
			description: 'You have invitations waiting for your response.',
			icon: 'inbox',
			href: '/invitations',
			priority: 'high',
			badge: `${pendingInvitations}`
		});
	}

	return actions.slice(0, 5);
};

const buildPendingActions = ({ profileCompletion, hasPreferences, pendingInvitations, matchedOpportunitiesCount }) => {
	const actions = [];

	if (profileCompletion.percent < 80) {
		actions.push({
			id: 'profile-completion',
			title: 'Complete your profile',
			description: profileCompletion.missing.length > 0
				? `Add ${profileCompletion.missing.slice(0, 3).join(', ')} to complete your profile.`
				: 'Add the remaining details to complete your profile.',
			progress: profileCompletion.percent,
			href: '/profile/edit',
			priority: 'high'
		});
	}

	if (!hasPreferences) {
		actions.push({
			id: 'set-preferences',
			title: 'Tell us your interests',
			description: 'Select primary and secondary domains to personalize your experience.',
			progress: 20,
			href: '/preferences',
			priority: 'high'
		});
	}

	if (pendingInvitations > 0) {
		actions.push({
			id: 'review-invitations',
			title: 'Respond to invitations',
			description: `You have ${pendingInvitations} pending invitation${pendingInvitations === 1 ? '' : 's'} awaiting your response.`,
			progress: 40,
			href: '/invitations',
			priority: 'medium'
		});
	}

	if (matchedOpportunitiesCount > 0) {
		actions.push({
			id: 'review-opportunities',
			title: 'Review matched opportunities',
			description: 'See the latest postings aligned with your interests.',
			progress: 60,
			href: '/postings',
			priority: 'medium'
		});
	}

	return actions.slice(0, 4);
};

const buildNotifications = ({ pendingInvitations, recentInvitations, profileCompletion, matchedOpportunitiesCount, sentInvitationsCount }) => {
	const notifications = [];

	if (pendingInvitations > 0) {
		notifications.push({
			id: 'notif-pending-invitations',
			title: 'Pending invitations',
			message: `You have ${pendingInvitations} invitation${pendingInvitations === 1 ? '' : 's'} that need attention.`,
			timestamp: recentInvitations?.[0]?.sent_at || new Date().toISOString(),
			level: 'warning',
			actionHref: '/invitations',
			isRead: false
		});
	}

	if (profileCompletion.percent < 80) {
		notifications.push({
			id: 'notif-profile',
			title: 'Complete your profile',
			message: 'Add the remaining details to help alumni discover you easily.',
			timestamp: new Date().toISOString(),
			level: 'info',
			actionHref: '/profile/edit',
			isRead: false
		});
	}

	if (matchedOpportunitiesCount > 0) {
		notifications.push({
			id: 'notif-opportunities',
			title: 'New matched opportunities',
			message: `We found ${matchedOpportunitiesCount} opportunities aligned with your interests.`,
			timestamp: new Date().toISOString(),
			level: 'success',
			actionHref: '/postings',
			isRead: false
		});
	}

	if (sentInvitationsCount > 0) {
		notifications.push({
			id: 'notif-invitations-sent',
			title: 'Invitation analytics',
			message: `You have sent ${sentInvitationsCount} invitation${sentInvitationsCount === 1 ? '' : 's'} so far. Track their status in invitations.`,
			timestamp: new Date().toISOString(),
			level: 'info',
			actionHref: '/invitations',
			isRead: true
		});
	}

	if (recentInvitations && recentInvitations.length > 0) {
		recentInvitations.forEach((invite) => {
			notifications.push({
				id: `notif-invite-${invite.id}`,
				title: invite.status === 'accepted' ? 'Invitation accepted' : 'Invitation update',
				message: invite.status === 'accepted'
					? 'An alumni invitation was recently accepted. Welcome them to the network!'
					: 'An invitation in your network has changed status.',
				timestamp: invite.updated_at || invite.sent_at,
				level: invite.status === 'accepted' ? 'success' : 'info',
				isRead: true
			});
		});
	}

	return notifications.slice(0, 6);
};

export const getMemberDashboard = async (req, res) => {
	try {
		if (!pool) {
			console.error('[dashboard] Database pool is not initialized');
			return res.status(500).json({ success: false, error: 'Dashboard service not available' });
		}

		const requestedIdRaw = req.query.userId ?? req.session?.accountId ?? req.user?.id;
		const requestedAccountId = requestedIdRaw ? String(requestedIdRaw).trim() : '';

		if (!requestedAccountId) {
			return res.status(400).json({ success: false, error: 'Invalid user identifier' });
		}

		if (req.user?.role !== 'admin' && req.user?.id && String(req.user.id) !== requestedAccountId) {
			return res.status(403).json({ success: false, error: 'Access denied' });
		}

		const connection = await pool.getConnection();

		try {
			const [userRows] = await connection.execute(`
				SELECT
					a.id,
					a.email,
					a.last_login_at,
					a.created_at,
					a.status,
					up.id AS user_profile_id,
					up.relationship,
					up.access_level,
					up.alumni_member_id,
					am.first_name,
					am.last_name,
					am.profile_image_url,
					am.batch AS graduation_year,
					am.center_name AS department,
					NULL AS current_position,
					NULL AS company,
					NULL AS location,
					NULL AS linkedin_url,
					NULL AS bio
				FROM accounts a
				LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
				LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
				WHERE a.id = ?
			`, [requestedAccountId]);

			if (!userRows || userRows.length === 0) {
				return res.status(404).json({ success: false, error: 'User not found' });
			}

			const userRow = userRows[0];

			// Use profileId if available (preferences are profile-based)
			const preferenceUserId = req.user.profileId || requestedAccountId;

			const [preferenceRows] = await connection.execute(`
				SELECT
					id,
					primary_domain_id,
					secondary_domain_ids,
					areas_of_interest_ids,
					preference_type,
					notification_settings,
					interface_settings
				FROM USER_PREFERENCES
				WHERE user_id = ?
			`, [preferenceUserId]);

			let preferences = null;
			let matchingDomainIds = [];
			const domainIdSet = new Set();

			if (preferenceRows && preferenceRows.length > 0) {
				const prefRow = preferenceRows[0];
				const secondaryIds = safeParseArray(prefRow.secondary_domain_ids).map(String);
				const interestIds = safeParseArray(prefRow.areas_of_interest_ids).map(String);

				if (prefRow.primary_domain_id) {
					domainIdSet.add(String(prefRow.primary_domain_id));
				}
				secondaryIds.forEach((id) => domainIdSet.add(String(id)));
				interestIds.forEach((id) => domainIdSet.add(String(id)));

				matchingDomainIds = uniqueStrings(Array.from(domainIdSet));

				let domainDetailsMap = new Map();
				if (domainIdSet.size > 0) {
					const domainIds = Array.from(domainIdSet);
					const placeholders = domainIds.map(() => '?').join(',');
					const [domainRows] = await connection.query(`
						SELECT id, name, description, icon, color_code, domain_level, parent_domain_id
						FROM DOMAINS
						WHERE id IN (${placeholders})
					`, domainIds);

					domainDetailsMap = new Map(domainRows.map((row) => [String(row.id), row]));
				}

				const primaryDomain = prefRow.primary_domain_id
					? domainDetailsMap.get(String(prefRow.primary_domain_id)) || null
					: null;

				const secondaryDomains = secondaryIds
					.map((id) => normalizeDomain(domainDetailsMap.get(String(id))))
					.filter(Boolean);

				const areasOfInterest = interestIds
					.map((id) => normalizeDomain(domainDetailsMap.get(String(id))))
					.filter(Boolean);

				preferences = {
					id: prefRow.id,
					primaryDomain: normalizeDomain(primaryDomain),
					secondaryDomains,
					areasOfInterest,
					preferenceType: prefRow.preference_type,
					notificationSettings: prefRow.notification_settings,
					interfaceSettings: prefRow.interface_settings
				};
			}

			const [[networkRow]] = await connection.query(`
				SELECT COUNT(*) AS count
				FROM accounts
				WHERE status = 'active'
			`);
			const networkSize = Math.max(0, Number(networkRow?.count || 0) - 1);

			const [[activePostingsRow]] = await connection.query(`
				SELECT COUNT(DISTINCT p.id) AS count
				FROM POSTINGS p
				WHERE p.status IN ('active', 'approved')
					AND (p.expires_at IS NULL OR p.expires_at >= NOW())
			`);
			const activeOpportunities = Number(activePostingsRow?.count || 0);

			const [[pendingInvitesRow]] = await connection.query(`
				SELECT COUNT(*) AS count
				FROM USER_INVITATIONS
				WHERE status = 'pending'
					AND expires_at > NOW()
					AND (user_id = ? OR email = ?)
			`, [requestedAccountId, userRow.email]);
			const pendingInvitations = Number(pendingInvitesRow?.count || 0);

			const [[sentInvitesRow]] = await connection.query(`
				SELECT COUNT(*) AS count
				FROM USER_INVITATIONS
				WHERE invited_by = ?
			`, [requestedAccountId]);
			const sentInvitationsCount = Number(sentInvitesRow?.count || 0);

			let matchedOpportunities = [];
			let matchedOpportunitiesCount = 0;

			if (matchingDomainIds.length > 0) {
				const placeholders = matchingDomainIds.map(() => '?').join(',');
				const [matchedRows] = await connection.query(`
					SELECT DISTINCT
						p.id,
						p.title,
						p.posting_type,
						p.location,
						p.urgency_level,
						p.view_count,
						p.interest_count,
						p.created_at
					FROM POSTINGS p
					INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
					WHERE p.status IN ('active', 'approved')
						AND (p.expires_at IS NULL OR p.expires_at >= NOW())
						AND pd.domain_id IN (${placeholders})
					ORDER BY p.interest_count DESC, p.view_count DESC, p.created_at DESC
					LIMIT 6
				`, matchingDomainIds);

				matchedOpportunities = matchedRows.map((row) => ({
					id: row.id,
					title: row.title,
					type: row.posting_type,
					location: row.location,
					urgency: row.urgency_level,
					viewCount: row.view_count,
					interestCount: row.interest_count,
					createdAt: row.created_at
				}));

				const [[matchedCountRow]] = await connection.query(`
					SELECT COUNT(DISTINCT p.id) AS count
					FROM POSTINGS p
					INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
					WHERE p.status IN ('active', 'approved')
						AND (p.expires_at IS NULL OR p.expires_at >= NOW())
						AND pd.domain_id IN (${placeholders})
				`, matchingDomainIds);

				matchedOpportunitiesCount = Number(matchedCountRow?.count || 0);
			}

			const [trendingRows] = await connection.query(`
				SELECT
					p.id,
					p.title,
					p.posting_type,
					p.location,
					p.urgency_level,
					p.view_count,
					p.interest_count,
					p.created_at
				FROM POSTINGS p
				WHERE p.status IN ('active', 'approved')
					AND (p.expires_at IS NULL OR p.expires_at >= NOW())
				ORDER BY p.view_count DESC, p.interest_count DESC, p.created_at DESC
				LIMIT 6
			`);

			const trendingOpportunities = trendingRows.map((row) => ({
				id: row.id,
				title: row.title,
				type: row.posting_type,
				location: row.location,
				urgency: row.urgency_level,
				viewCount: row.view_count,
				interestCount: row.interest_count,
				createdAt: row.created_at
			}));

			const [activityRows] = await connection.query(`
				SELECT id, item_type, title, content, author_name, created_at
				FROM ACTIVITY_FEED
				WHERE user_id = ?
				AND item_type IN ('connection', 'event', 'achievement')
				ORDER BY created_at DESC
				LIMIT 6
			`, [requestedAccountId]);

			const recentActivity = activityRows.map((row) => ({
				id: row.id,
				type: row.item_type,
				title: row.title,
				content: row.content,
				actor: row.author_name,
				timestamp: row.created_at
			}));

			const [recommendedRows] = await connection.query(`
				SELECT
					a.id,
					am.first_name,
					am.last_name,
					NULL AS current_position,
					NULL AS company,
					NULL AS location,
					am.profile_image_url,
					a.last_login_at,
					am.batch AS graduation_year,
					am.center_name AS department,
					pref.primary_domain_id
				FROM accounts a
				LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
				LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
				LEFT JOIN USER_PREFERENCES pref ON pref.user_id = up.id
				WHERE a.id != ? AND a.status = 'active'
				ORDER BY
					(CASE WHEN am.batch IS NOT NULL AND am.batch = ? THEN 1 ELSE 0 END) DESC,
					(CASE WHEN pref.primary_domain_id IS NOT NULL AND ? IS NOT NULL AND pref.primary_domain_id = ? THEN 1 ELSE 0 END) DESC,
					a.last_login_at DESC
				LIMIT 6
			`, [
				requestedAccountId,
				userRow.graduation_year || null,
				preferences?.primaryDomain?.id || null,
				preferences?.primaryDomain?.id || null
			]);

			const recommendedConnections = recommendedRows.map((row) => ({
				id: row.id,
				firstName: row.first_name,
				lastName: row.last_name,
				fullName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
				position: row.current_position,
				company: row.company,
				location: row.location,
				avatarUrl: row.profile_image_url,
				lastActiveAt: row.last_login_at,
				sharedAttributes: computeSharedAttributes(userRow, row, preferences)
			}));

			const [recentInvitationsRows] = await connection.query(`
				SELECT id, status, sent_at, expires_at, updated_at
				FROM USER_INVITATIONS
				WHERE (user_id = ? OR email = ?)
				ORDER BY sent_at DESC
				LIMIT 3
			`, [requestedAccountId, userRow.email]);
			const recentInvitations = recentInvitationsRows;

			const profileCompletion = calculateProfileCompletion(userRow, preferences);

			const summary = createSummary(userRow, profileCompletion, preferences);
			const stats = {
				networkSize,
				activeOpportunities,
				matchedOpportunities: matchedOpportunitiesCount,
				pendingInvitations,
				profileCompletion: profileCompletion.percent,
				invitationsSent: sentInvitationsCount
			};

			const pendingActions = buildPendingActions({
				profileCompletion,
				hasPreferences: Boolean(preferences?.primaryDomain),
				pendingInvitations,
				matchedOpportunitiesCount
			});

			const quickActions = buildQuickActions({
				profileCompletion,
				hasPreferences: Boolean(preferences?.primaryDomain),
				pendingInvitations,
				matchedOpportunitiesCount
			});

			const notifications = buildNotifications({
				pendingInvitations,
				recentInvitations,
				profileCompletion,
				matchedOpportunitiesCount,
				sentInvitationsCount
			});

			const domainFocus = preferences
				? {
					primary: preferences.primaryDomain || null,
					secondary: preferences.secondaryDomains || [],
					interests: preferences.areasOfInterest || []
				}
				: null;

			res.json({
				success: true,
				summary,
				stats,
				quickActions,
				notifications,
				pendingActions,
				recommendedConnections,
				opportunities: {
					matched: matchedOpportunities,
					trending: trendingOpportunities
				},
				recentActivity,
				domainFocus,
				meta: {
					generatedAt: new Date().toISOString()
				}
			});
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error('[dashboard] Failed to build member dashboard:', error);
		const isProd = process.env.NODE_ENV === 'production';
		const payload = {
			success: false,
			error: isProd ? 'Failed to load dashboard overview' : (error && error.message) || 'Failed to load dashboard overview'
		};

		if (!isProd && error && error.stack) {
			payload.stack = error.stack;
		}

		res.status(500).json(payload);
	}
};
