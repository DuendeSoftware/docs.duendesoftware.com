// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightClientMermaid from '@pasqal-io/starlight-client-mermaid';

// https://astro.build/config
export default defineConfig({
	trailingSlash: 'ignore',
	redirects: {
		"/identityserver/v7/bff": "/bff/v3/",
		"/identityserver/v7/samples/bff": "/bff/v3/samples",
		"/identityserver/v7/bff/architecture": "/bff/v3/architecture/",
		"/identityserver/v7/bff/overview": "/bff/v3/overview",
		"/identityserver/v7/bff/apis": "/bff/v3/fundamentals/apis",
		"/identityserver/v7/bff/extensibility": "/bff/v3/extensibility/",
		"/identityserver/v7/bff/options": "/bff/v3/fundamentals/options",
		"/identityserver/v7/bff/session": "/bff/v3/fundamentals/session",
		"/identityserver/v7/bff/tokens": "/bff/v3/fundamentals/tokens",
		"/identityserver/v7/bff/apis/local": "/bff/v3/fundamentals/apis/local",
		"/identityserver/v7/bff/apis/remote": "/bff/v3/fundamentals/apis/remote",
		"/identityserver/v7/bff/apis/yarp": "/bff/v3/fundamentals/apis/yarp",
		"/identityserver/v7/bff/architecture/ui-hosting": "/bff/v3/architecture/ui-hosting",
		"/identityserver/v7/bff/architecture/third-party-cookies": "/bff/v3/architecture/third-party-cookies",
		"/identityserver/v7/bff/extensibility/http_forwarder": "/bff/v3/extensibility/http_forwarder",
		"/identityserver/v7/bff/extensibility/management": "/bff/v3/extensibility/management",
		"/identityserver/v7/bff/extensibility/sessions": "/bff/v3/extensibility/sessions",
		"/identityserver/v7/bff/extensibility/tokens": "/bff/v3/extensibility/tokens",
		"/identityserver/v7/bff/extensibility/management/silent-login": "/bff/v3/extensibility/management/silent-login",
		"/identityserver/v7/bff/extensibility/management/login": "/bff/v3/extensibility/management/login",
		"/identityserver/v7/bff/extensibility/management/logout": "/bff/v3/extensibility/management/logout",
		"/identityserver/v7/bff/extensibility/management/user": "/bff/v3/extensibility/management/user",
		"/identityserver/v7/bff/extensibility/management/silent-login-callback": "/bff/v3/extensibility/management/silent-login-callback",
		"/identityserver/v7/bff/extensibility/management/back-channel-logout": "/bff/v3/extensibility/management/back-channel-logout",
		"/identityserver/v7/bff/extensibility/management/diagnostics": "/bff/v3/extensibility/management/diagnostics",
		"/identityserver/v7/bff/session/management": "/bff/v3/fundamentals/session/management",
		"/identityserver/v7/bff/session/handlers": "/bff/v3/fundamentals/session/handlers",
		"/identityserver/v7/bff/session/server_side_sessions": "/bff/v3/fundamentals/session/server_side_sessions",
		"/identityserver/v7/bff/session/management/silent-login": "/bff/v3/fundamentals/session/management/silent-login",
		"/identityserver/v7/bff/session/management/login": "/bff/v3/fundamentals/session/management/login",
		"/identityserver/v7/bff/session/management/logout": "/bff/v3/fundamentals/session/management/logout",
		"/identityserver/v7/bff/session/management/user": "/bff/v3/fundamentals/session/management/user",
		"/identityserver/v7/bff/session/management/back-channel-logout": "/bff/v3/fundamentals/session/management/back-channel-logout",
		"/identityserver/v7/bff/session/management/diagnostics": "/bff/v3/fundamentals/session/management/diagnostics",
	},
	integrations: [
		starlight({
			plugins: [
				starlightClientMermaid({ /* options */ }),
				starlightLinksValidator({
					errorOnFallbackPages: false,
					errorOnInconsistentLocale: true,
				})
			],
			title: 'Duende Software Docs',
			logo: {
				light: './src/assets/duende-logo.png',
				dark: './src/assets/duende-logo-dark.png',
				replacesTitle: true,
			},
			lastUpdated: true,
			editLink: {
				baseUrl: 'https://github.com/DuendeSoftware/docs.duendesoftware.com/edit/main/docs/',
			},
			social: {
				github: 'https://github.com/DuendeSoftware',
				blueSky: 'https://bsky.app/profile/duendesoftware.com',
				linkedin: 'https://www.linkedin.com/company/duendesoftware/'
			},
			components: {
				Footer: './src/overrides/Footer.astro'
			},
			sidebar: [
					{
						label: 'General information',
						items: [
							{ label: 'Licensing', link: 'https://www.nasa.gov/' },
							{ label: 'Support and Issues', link: 'https://www.nasa.gov/' },
							{ label: 'Security best-practices', link: 'https://www.nasa.gov/' },
							{ label: 'Glossary', link: 'https://www.nasa.gov/' },
						]
					},
					{
						label: 'IdentityServer',
						items: [
							{
								label: 'Getting Started',
								items: [
									{label: 'Licensing', link: 'https://www.nasa.gov/'},
									{label: 'Support and Issues', link: 'https://www.nasa.gov/'},
									{label: 'Security best-practices', link: 'https://www.nasa.gov/'},
									{label: 'Glossary', link: 'https://www.nasa.gov/'},
								],
								collapsed: true,
							},
							{
								label: '...',
								autogenerate: {directory: 'identityserver/v7'},
								collapsed: true,
							},
							{
								label: 'Release notes',
								items: [
									{label: '7.1', link: 'https://www.nasa.gov/'},
									{label: '7.0', link: 'https://www.nasa.gov/'},
								]
							},
							{
								label: 'Migration',
								autogenerate: {directory: 'identityserver/v7/upgrades'},
								collapsed: true,
							},
							{
								label: 'API reference',
								items: [
									{label: '7.1', link: 'https://www.nasa.gov/'},
									{label: '7.0', link: 'https://www.nasa.gov/'},
								],
								collapsed: true,
							},
						]
					},
					{
						label: 'Backend-for-Frontend (BFF)',
						items: [
							{
								label: 'Getting Started',
								items: [
									{label: 'Licensing', link: 'https://www.nasa.gov/'},
									{label: 'Support and Issues', link: 'https://www.nasa.gov/'},
									{label: 'Security best-practices', link: 'https://www.nasa.gov/'},
									{label: 'Glossary', link: 'https://www.nasa.gov/'},
								],
								collapsed: true,
							},
							{
								label: '...',
								autogenerate: {directory: 'identityserver/bff'},
								collapsed: true,
							},
							{
								label: 'Release notes',
								items: [
									{label: '3.0', link: 'https://www.nasa.gov/'},
									{label: '2.0', link: 'https://www.nasa.gov/'},
								]
							},
							{
								label: 'Migration',
								autogenerate: {directory: 'identityserver/v7/upgrades'},
								collapsed: true,
							},
							{
								label: 'API reference',
								items: [
									{label: '3.0', link: 'https://www.nasa.gov/'},
								],
								collapsed: true,
							},
						]
					},
					{
						label: 'Token Management',
						badge: 'oss',
						items: [
							{
								label: 'Getting Started',
								items: [
									{label: 'Licensing', link: 'https://www.nasa.gov/'},
									{label: 'Support and Issues', link: 'https://www.nasa.gov/'},
									{label: 'Security best-practices', link: 'https://www.nasa.gov/'},
									{label: 'Glossary', link: 'https://www.nasa.gov/'},
								],
								collapsed: true,
							}
						]
					},
					{
						label: 'IdentityModel',
						badge: 'oss',
						items: [
							{
								label: 'Getting Started',
								items: [
									{label: 'Licensing', link: 'https://www.nasa.gov/'},
									{label: 'Support and Issues', link: 'https://www.nasa.gov/'},
									{label: 'Security best-practices', link: 'https://www.nasa.gov/'},
									{label: 'Glossary', link: 'https://www.nasa.gov/'},
								],
								collapsed: true,
							}
						]
					},
			],
		}),
	],
});
